import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { prayerLogs, prayerRequests, couples } from "../db/schema-app";
import {
  calcularRacha,
  fechaLocal,
  rachaMasLarga,
  sumarDias,
  diferenciaEnDias,
} from "./fecha";

export async function registrarOracion(
  userId: string,
  zona: string,
  opciones: { minutos?: number; origen?: string } = {},
) {
  const hoy = fechaLocal(zona);

  // Un registro por día: volver a pulsar no infla la racha.
  await db
    .insert(prayerLogs)
    .values({
      userId,
      fechaLocal: hoy,
      minutos: opciones.minutos ?? null,
      origen: opciones.origen ?? "check-in",
    })
    .onConflictDoUpdate({
      target: [prayerLogs.userId, prayerLogs.fechaLocal],
      set: { minutos: opciones.minutos ?? null },
    });

  return hoy;
}

export type MetricasOracion = {
  hoyRegistrado: boolean;
  racha: number;
  masLarga: number;
  constanciaDelMes: number;
  minutosEstaSemana: number;
  diasDeGracia: string[];
  /** 0 sin registro · 1 gracia · 2 oró · 3 devocional. */
  mapaCalor: { fecha: string; nivel: number }[];
};

export async function obtenerMetricas(
  userId: string,
  zona: string,
): Promise<MetricasOracion> {
  const hoy = fechaLocal(zona);
  const desde = sumarDias(hoy, -118);

  const registros = await db
    .select()
    .from(prayerLogs)
    .where(eq(prayerLogs.userId, userId))
    .orderBy(desc(prayerLogs.fechaLocal));

  const fechas = registros.map((r) => r.fechaLocal);
  const { actual, diasDeGracia } = calcularRacha(fechas, hoy);

  const porFecha = new Map(registros.map((r) => [r.fechaLocal, r]));
  const gracia = new Set(diasDeGracia);

  const mapaCalor: { fecha: string; nivel: number }[] = [];
  for (let i = 0; i < 119; i++) {
    const fecha = sumarDias(desde, i);
    const registro = porFecha.get(fecha);
    const nivel = registro
      ? registro.origen === "devocional"
        ? 3
        : 2
      : gracia.has(fecha)
        ? 1
        : 0;
    mapaCalor.push({ fecha, nivel });
  }

  // Constancia del mes: días con registro sobre días transcurridos.
  const inicioMes = `${hoy.slice(0, 7)}-01`;
  const diasDelMes = diferenciaEnDias(inicioMes, hoy) + 1;
  const conRegistroEsteMes = fechas.filter((f) => f >= inicioMes).length;

  const inicioSemana = sumarDias(hoy, -6);
  const minutosEstaSemana = registros
    .filter((r) => r.fechaLocal >= inicioSemana)
    .reduce((suma, r) => suma + (r.minutos ?? 0), 0);

  return {
    hoyRegistrado: porFecha.has(hoy),
    racha: actual,
    masLarga: rachaMasLarga(fechas),
    constanciaDelMes:
      diasDelMes > 0 ? Math.round((conRegistroEsteMes / diasDelMes) * 100) : 0,
    minutosEstaSemana,
    diasDeGracia,
    mapaCalor,
  };
}

/** Días en que los dos oraron. Es la métrica norte del producto. */
export async function rachaDePareja(
  coupleId: string,
  zona: string,
): Promise<number> {
  const pareja = await db.query.couples.findFirst({
    where: eq(couples.id, coupleId),
  });
  if (!pareja) return 0;

  // Los días en que ambos registraron los agrupa Postgres, no JavaScript.
  const ambos = await db
    .select({ fecha: prayerLogs.fechaLocal })
    .from(prayerLogs)
    .where(inArray(prayerLogs.userId, [pareja.miembroA, pareja.miembroB]))
    .groupBy(prayerLogs.fechaLocal)
    .having(sql`count(distinct ${prayerLogs.userId}) = 2`);

  return calcularRacha(
    ambos.map((f) => f.fecha),
    fechaLocal(zona),
  ).actual;
}

// ------------------------------------------------------------ Peticiones

export async function listarPeticiones(userId: string, coupleId?: string) {
  const propias = await db
    .select()
    .from(prayerRequests)
    .where(eq(prayerRequests.autorId, userId))
    .orderBy(desc(prayerRequests.createdAt));

  // Las de la pareja solo si están marcadas como compartidas.
  const compartidas = coupleId
    ? await db
        .select()
        .from(prayerRequests)
        .where(
          and(
            eq(prayerRequests.coupleId, coupleId),
            eq(prayerRequests.compartida, true),
            sql`${prayerRequests.autorId} <> ${userId}`,
          ),
        )
        .orderBy(desc(prayerRequests.createdAt))
    : [];

  return { propias, compartidas };
}

export async function crearPeticion(
  userId: string,
  datos: {
    titulo: string;
    detalle?: string;
    compartida?: boolean;
    coupleId?: string | null;
  },
) {
  const [fila] = await db
    .insert(prayerRequests)
    .values({
      autorId: userId,
      titulo: datos.titulo,
      detalle: datos.detalle ?? null,
      compartida: datos.compartida ?? false,
      coupleId: datos.compartida ? (datos.coupleId ?? null) : null,
    })
    .returning();
  return fila;
}

export async function cambiarEstadoPeticion(
  userId: string,
  peticionId: string,
  estado: "activa" | "respondida" | "archivada",
  nota?: string,
) {
  // El filtro por autor es la autorización: nadie toca peticiones ajenas.
  const [fila] = await db
    .update(prayerRequests)
    .set({
      estado,
      nota: estado === "respondida" ? (nota ?? null) : null,
      respondidaEn: estado === "respondida" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(prayerRequests.id, peticionId),
        eq(prayerRequests.autorId, userId),
      ),
    )
    .returning();

  if (!fila) throw new Error("No encontramos esa petición.");
  return fila;
}

export async function contarRespondidas(userId: string) {
  const [fila] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(prayerRequests)
    .where(
      and(
        eq(prayerRequests.autorId, userId),
        eq(prayerRequests.estado, "respondida"),
      ),
    );
  return fila?.n ?? 0;
}

export async function minutosDesde(userId: string, desde: string) {
  const [fila] = await db
    .select({ total: sql<number>`coalesce(sum(${prayerLogs.minutos}), 0)::int` })
    .from(prayerLogs)
    .where(
      and(eq(prayerLogs.userId, userId), gte(prayerLogs.fechaLocal, desde)),
    );
  return fila?.total ?? 0;
}
