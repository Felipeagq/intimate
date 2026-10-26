import { and, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { user, session } from "../db/schema";
import { adminUser } from "../db/schema-admin";
import {
  couples,
  coupleInvites,
  devotionals,
  prayerLogs,
  promises,
  coupleAgreements,
  affirmations,
  checkinResponses,
} from "../db/schema-app";
import { fechaLocal, sumarDias, calcularRacha } from "./fecha";

/**
 * Consultas del panel.
 *
 * Todo lo que sale de aquí es agregado o de cuenta: correo, estado y fechas.
 * Ninguna función devuelve contenido escrito por un usuario, y es
 * deliberado — el panel no puede mostrar lo que no recibe.
 */

export type Metrica = { valor: number; delta: number | null };

function delta(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}

export async function obtenerMetricas() {
  const hoy = fechaLocal("UTC");
  const hace7 = sumarDias(hoy, -7);
  const hace14 = sumarDias(hoy, -14);
  const hace30 = new Date(Date.now() - 30 * 86_400_000);

  const [usuarios] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ultimos30: sql<number>`count(*) filter (where ${user.createdAt} >= ${hace30})::int`,
    })
    .from(user);

  const [parejas] = await db
    .select({
      activas: sql<number>`count(*) filter (where ${couples.estado} = 'activa')::int`,
      archivadas: sql<number>`count(*) filter (where ${couples.estado} = 'archivada')::int`,
    })
    .from(couples);

  // Parejas activas esta semana: ambos miembros oraron en los últimos 7 días.
  const [parejasActivas] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from ${couples} c
    where c.estado = 'activa'
      and exists (select 1 from ${prayerLogs} p
                  where p.user_id = c.miembro_a and p.fecha_local >= ${hace7})
      and exists (select 1 from ${prayerLogs} p
                  where p.user_id = c.miembro_b and p.fecha_local >= ${hace7})
  `).then((r) => r.rows);

  const [parejasActivasPrevia] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from ${couples} c
    where c.estado = 'activa'
      and exists (select 1 from ${prayerLogs} p
                  where p.user_id = c.miembro_a
                    and p.fecha_local >= ${hace14} and p.fecha_local < ${hace7})
      and exists (select 1 from ${prayerLogs} p
                  where p.user_id = c.miembro_b
                    and p.fecha_local >= ${hace14} and p.fecha_local < ${hace7})
  `).then((r) => r.rows);

  // Solo de pareja: es la métrica norte. Mezclar con los personales
  // sobreestimaba el ritual compartido que el producto quiere medir.
  const [devocionales] = await db
    .select({
      semana: sql<number>`count(*) filter (where ${devotionals.fechaLocal} >= ${hace7})::int`,
      semanaPrevia: sql<number>`count(*) filter (where ${devotionals.fechaLocal} >= ${hace14} and ${devotionals.fechaLocal} < ${hace7})::int`,
    })
    .from(devotionals)
    .where(eq(devotionals.scope, "pareja"));

  const [invitaciones] = await db
    .select({
      enviadas: sql<number>`count(*)::int`,
      aceptadas: sql<number>`count(*) filter (where ${coupleInvites.usadaEn} is not null)::int`,
    })
    .from(coupleInvites);

  const aceptacion =
    invitaciones.enviadas > 0
      ? Math.round((invitaciones.aceptadas / invitaciones.enviadas) * 100)
      : 0;

  return {
    parejasActivas: {
      valor: parejasActivas?.n ?? 0,
      delta: delta(parejasActivas?.n ?? 0, parejasActivasPrevia?.n ?? 0),
    } satisfies Metrica,
    usuarios: { valor: usuarios?.total ?? 0, delta: null } satisfies Metrica,
    parejasVinculadas: {
      valor: parejas?.activas ?? 0,
      delta: null,
    } satisfies Metrica,
    devocionalesSemana: {
      valor: devocionales?.semana ?? 0,
      delta: delta(devocionales?.semana ?? 0, devocionales?.semanaPrevia ?? 0),
    } satisfies Metrica,
    aceptacionInvitacion: { valor: aceptacion, delta: null } satisfies Metrica,
    parejasArchivadas: {
      valor: parejas?.archivadas ?? 0,
      delta: null,
    } satisfies Metrica,
  };
}

/** Parejas activas por semana, últimas 12 semanas. */
export async function serieParejasActivas() {
  const hoy = fechaLocal("UTC");
  const serie: { semana: string; valor: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const fin = sumarDias(hoy, -7 * i);
    const inicio = sumarDias(fin, -7);

    const { rows } = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from ${couples} c
      where c.estado = 'activa'
        and exists (select 1 from ${prayerLogs} p
                    where p.user_id = c.miembro_a
                      and p.fecha_local >= ${inicio} and p.fecha_local < ${fin})
        and exists (select 1 from ${prayerLogs} p
                    where p.user_id = c.miembro_b
                      and p.fecha_local >= ${inicio} and p.fecha_local < ${fin})
    `);

    serie.push({ semana: inicio, valor: rows[0]?.n ?? 0 });
  }

  return serie;
}

export type CuentaPanel = {
  id: string;
  email: string;
  estado: string;
  creada: Date;
  ultimoAcceso: Date | null;
  pareja: "vinculada" | "archivada" | "sin vincular";
};

export async function buscarCuentas(
  busqueda?: string,
  limite = 50,
): Promise<CuentaPanel[]> {
  const filas = await db
    .select({
      id: user.id,
      email: user.email,
      estado: user.estado,
      creada: user.createdAt,
      ultimoAcceso: sql<Date | null>`max(${session.createdAt})`,
      conPareja: sql<number>`count(distinct ${couples.id}) filter (where ${couples.estado} = 'activa')::int`,
      conArchivada: sql<number>`count(distinct ${couples.id}) filter (where ${couples.estado} = 'archivada')::int`,
    })
    .from(user)
    .leftJoin(session, eq(session.userId, user.id))
    .leftJoin(
      couples,
      sql`${couples.miembroA} = ${user.id} or ${couples.miembroB} = ${user.id}`,
    )
    .where(busqueda ? ilike(user.email, `%${busqueda}%`) : undefined)
    .groupBy(user.id)
    .orderBy(desc(user.createdAt))
    .limit(limite);

  return filas.map((f) => ({
    id: f.id,
    email: f.email,
    estado: f.estado ?? "activa",
    creada: f.creada,
    ultimoAcceso: f.ultimoAcceso,
    pareja:
      f.conPareja > 0
        ? "vinculada"
        : f.conArchivada > 0
          ? "archivada"
          : "sin vincular",
  }));
}

export type DetalleCuenta = {
  id: string;
  email: string;
  estado: string;
  creada: Date;
  ultimoAcceso: Date | null;
  pareja: {
    estado: "activa" | "archivada";
    email: string | null;
    vinculadaEn: Date;
    archivadaEn: Date | null;
  } | null;
};

/**
 * Detalle de una cuenta para la vista individual de soporte.
 *
 * Si la pareja activa no existe, se busca la más reciente archivada: así
 * soporte ve con quién estuvo vinculada una cuenta aunque ya se haya
 * desvinculado, sin necesidad de consultar la base a mano.
 */
export async function obtenerDetalleCuenta(
  usuarioId: string,
): Promise<DetalleCuenta | null> {
  const cuenta = await db.query.user.findFirst({
    where: eq(user.id, usuarioId),
  });
  if (!cuenta) return null;

  const [fila] = await db
    .select({ ultimoAcceso: sql<Date | null>`max(${session.createdAt})` })
    .from(session)
    .where(eq(session.userId, usuarioId));

  const esMiembro = or(
    eq(couples.miembroA, usuarioId),
    eq(couples.miembroB, usuarioId),
  );

  const parejaFila =
    (await db.query.couples.findFirst({
      where: and(eq(couples.estado, "activa"), esMiembro),
    })) ??
    (await db.query.couples.findFirst({
      where: and(eq(couples.estado, "archivada"), esMiembro),
      orderBy: (c, { desc: d }) => [d(c.archivadaEn)],
    }));

  let pareja: DetalleCuenta["pareja"] = null;
  if (parejaFila) {
    const otroId =
      parejaFila.miembroA === usuarioId
        ? parejaFila.miembroB
        : parejaFila.miembroA;
    const otro = await db.query.user.findFirst({ where: eq(user.id, otroId) });

    pareja = {
      estado: parejaFila.estado as "activa" | "archivada",
      email: otro?.email ?? null,
      vinculadaEn: parejaFila.vinculadaEn,
      archivadaEn: parejaFila.archivadaEn,
    };
  }

  return {
    id: cuenta.id,
    email: cuenta.email,
    estado: cuenta.estado ?? "activa",
    creada: cuenta.createdAt,
    ultimoAcceso: fila?.ultimoAcceso ?? null,
    pareja,
  };
}

export async function cambiarEstadoCuenta(
  usuarioId: string,
  estado: "activa" | "suspendida" | "eliminación pendiente",
) {
  return db.transaction(async (tx) => {
    const [fila] = await tx
      .update(user)
      .set({ estado, updatedAt: new Date() })
      .where(eq(user.id, usuarioId))
      .returning({ id: user.id, email: user.email });

    if (!fila) throw new Error("No encontramos esa cuenta.");

    // Suspender tiene que cerrar las sesiones abiertas; si no, la persona
    // sigue dentro hasta que caduque su cookie.
    if (estado !== "activa") {
      await tx.delete(session).where(eq(session.userId, usuarioId));
    }

    return fila;
  });
}

export async function listarEquipo() {
  return db
    .select({
      id: adminUser.id,
      email: adminUser.email,
      rol: adminUser.rol,
      mfa: adminUser.twoFactorEnabled,
      creada: adminUser.createdAt,
    })
    .from(adminUser)
    .orderBy(adminUser.createdAt);
}

export async function usuariosActivosDesde(dias: number) {
  const desde = sumarDias(fechaLocal("UTC"), -dias);
  const [fila] = await db
    .select({ n: sql<number>`count(distinct ${prayerLogs.userId})::int` })
    .from(prayerLogs)
    .where(gte(prayerLogs.fechaLocal, desde));
  return fila?.n ?? 0;
}

export async function contarCuentasPorEstado() {
  const filas = await db
    .select({ estado: user.estado, n: sql<number>`count(*)::int` })
    .from(user)
    .groupBy(user.estado);
  return filas;
}

// ---------------------------------------------------- Embudo de activación

export type PasoEmbudo = { paso: string; valor: number };

/**
 * Registro → invitación enviada → aceptada → primer devocional de pareja →
 * racha de pareja de más de 7 días.
 *
 * Cada paso cuenta usuarios o parejas distintas, nunca eventos sueltos: un
 * usuario que manda tres invitaciones sigue contando una sola vez en
 * "invitación enviada". Así el embudo muestra personas, no acciones.
 */
export async function embudoActivacion(
  /** Si la pantalla ya la calculó, se reutiliza: evita recorrer todas las
   *  parejas dos veces en la misma carga. */
  distribucion?: BucketRacha[],
): Promise<PasoEmbudo[]> {
  const [registro] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(user);

  const [invitacionEnviada] = await db
    .select({ n: sql<number>`count(distinct ${coupleInvites.creadorId})::int` })
    .from(coupleInvites);

  // Personas cuya invitación fue usada. Se cuenta por invitación y no por
  // filas de `couples`: una pareja que se archiva y se vuelve a vincular
  // genera dos filas, y el embudo mostraría más aceptadas que enviadas.
  const [invitacionAceptada] = await db
    .select({ n: sql<number>`count(distinct ${coupleInvites.creadorId})::int` })
    .from(coupleInvites)
    .where(sql`${coupleInvites.usadaEn} is not null`);

  const [primerDevocional] = await db
    .select({ n: sql<number>`count(distinct ${devotionals.coupleId})::int` })
    .from(devotionals)
    .where(eq(devotionals.scope, "pareja"));

  // Racha de 7+: sale de la misma distribución que muestra su gráfico.
  const rachas = distribucion ?? (await distribucionDeRachas());
  const racha7Mas = rachas
    .filter((b) => ["8-14", "15-30", "30+"].includes(b.bucket))
    .reduce((suma, b) => suma + b.parejas, 0);

  return [
    { paso: "Se registraron", valor: registro?.n ?? 0 },
    { paso: "Invitaron a su pareja", valor: invitacionEnviada?.n ?? 0 },
    { paso: "La pareja aceptó", valor: invitacionAceptada?.n ?? 0 },
    { paso: "Primer devocional juntos", valor: primerDevocional?.n ?? 0 },
    { paso: "Racha de pareja de más de 7 días", valor: racha7Mas },
  ];
}

// ------------------------------------------------- Distribución de rachas

export type BucketRacha = {
  bucket: "0" | "1-3" | "4-7" | "8-14" | "15-30" | "30+";
  parejas: number;
};

const BUCKETS_RACHA: BucketRacha["bucket"][] = [
  "0",
  "1-3",
  "4-7",
  "8-14",
  "15-30",
  "30+",
];

function bucketDeRacha(dias: number): BucketRacha["bucket"] {
  if (dias === 0) return "0";
  if (dias <= 3) return "1-3";
  if (dias <= 7) return "4-7";
  if (dias <= 14) return "8-14";
  if (dias <= 30) return "15-30";
  return "30+";
}

/**
 * Cuántas parejas activas tienen cada tamaño de racha.
 *
 * No es el promedio: el documento marca como riesgo que las rachas generen
 * culpa y abandono, y un promedio esconde justo el patrón peligroso de
 * muchas parejas atascadas en "día 1, se rompe, día 1 otra vez".
 */
export async function distribucionDeRachas(): Promise<BucketRacha[]> {
  const activas = await db.query.couples.findMany({
    where: eq(couples.estado, "activa"),
  });

  const conteo = new Map<BucketRacha["bucket"], number>(
    BUCKETS_RACHA.map((b) => [b, 0]),
  );

  const hoy = fechaLocal("UTC");

  for (const pareja of activas) {
    const ambos = await db
      .select({ fecha: prayerLogs.fechaLocal })
      .from(prayerLogs)
      .where(inArray(prayerLogs.userId, [pareja.miembroA, pareja.miembroB]))
      .groupBy(prayerLogs.fechaLocal)
      .having(sql`count(distinct ${prayerLogs.userId}) = 2`);

    const racha = calcularRacha(
      ambos.map((f) => f.fecha),
      hoy,
    ).actual;

    const bucket = bucketDeRacha(racha);
    conteo.set(bucket, (conteo.get(bucket) ?? 0) + 1);
  }

  return BUCKETS_RACHA.map((bucket) => ({
    bucket,
    parejas: conteo.get(bucket) ?? 0,
  }));
}

// --------------------------------------------------- Retención por cohorte

export type FilaCohorte = {
  semanaInicio: string;
  tamano: number;
  semanas: (number | null)[]; // % activa en la semana 1, 2, 3 y 4 tras vincularse
};

/**
 * Parejas agrupadas por la semana en que se vincularon, y qué porcentaje
 * de cada grupo seguía activa (ambos oraron) una, dos, tres y cuatro
 * semanas después de vincularse. La columna de la semana 4 es la D30 del
 * documento; el resto es lo que explica cómo se llegó —o no— hasta ahí.
 *
 * Solo se muestran las semanas donde ya pasó tiempo suficiente: una pareja
 * vinculada ayer no puede tener dato de "semana 4", así que esa celda queda
 * en null en vez de en 0, que significaría otra cosa.
 */
export async function retencionPorCohorte(semanas = 8): Promise<FilaCohorte[]> {
  const hoy = fechaLocal("UTC");
  const filas: FilaCohorte[] = [];

  for (let i = semanas - 1; i >= 0; i--) {
    const inicioCohorte = sumarDias(hoy, -7 * (i + 1));
    const finCohorte = sumarDias(inicioCohorte, 7);

    const cohorte = await db.query.couples.findMany({
      where: and(
        gte(couples.vinculadaEn, new Date(`${inicioCohorte}T00:00:00Z`)),
        sql`${couples.vinculadaEn} < ${new Date(`${finCohorte}T00:00:00Z`)}`,
      ),
    });

    if (cohorte.length === 0) {
      filas.push({ semanaInicio: inicioCohorte, tamano: 0, semanas: [null, null, null, null] });
      continue;
    }

    const porcentajes: (number | null)[] = [];

    for (let semana = 1; semana <= 4; semana++) {
      const desde = sumarDias(inicioCohorte, 7 * (semana - 1));
      const hasta = sumarDias(desde, 7);

      // Si esa ventana todavía no ha terminado, no hay dato que mostrar.
      if (hasta > hoy) {
        porcentajes.push(null);
        continue;
      }

      let activas = 0;
      for (const pareja of cohorte) {
        const [fila] = await db
          .select({ n: sql<number>`count(distinct ${prayerLogs.userId})::int` })
          .from(prayerLogs)
          .where(
            and(
              inArray(prayerLogs.userId, [pareja.miembroA, pareja.miembroB]),
              gte(prayerLogs.fechaLocal, desde),
              sql`${prayerLogs.fechaLocal} < ${hasta}`,
            ),
          );
        if ((fila?.n ?? 0) === 2) activas++;
      }

      porcentajes.push(Math.round((activas / cohorte.length) * 100));
    }

    filas.push({
      semanaInicio: inicioCohorte,
      tamano: cohorte.length,
      semanas: porcentajes,
    });
  }

  return filas;
}

// ------------------------------------------------------- Desglose por módulo

export type FilaModulo = { modulo: string; estaSemana: number; semanaPrevia: number };

/** Cuántas veces se usó cada módulo en los últimos 7 días, contra los 7 previos. */
export async function desgloseModulos(): Promise<FilaModulo[]> {
  const hoy = fechaLocal("UTC");
  const hace7 = sumarDias(hoy, -7);
  const hace14 = sumarDias(hoy, -14);

  const [devocionalPareja] = await db
    .select({
      semana: sql<number>`count(*) filter (where ${devotionals.fechaLocal} >= ${hace7})::int`,
      semanaPrevia: sql<number>`count(*) filter (where ${devotionals.fechaLocal} >= ${hace14} and ${devotionals.fechaLocal} < ${hace7})::int`,
    })
    .from(devotionals)
    .where(eq(devotionals.scope, "pareja"));

  const [devocionalPersonal] = await db
    .select({
      semana: sql<number>`count(*) filter (where ${devotionals.fechaLocal} >= ${hace7})::int`,
      semanaPrevia: sql<number>`count(*) filter (where ${devotionals.fechaLocal} >= ${hace14} and ${devotionals.fechaLocal} < ${hace7})::int`,
    })
    .from(devotionals)
    .where(eq(devotionals.scope, "personal"));

  const [oracion] = await db
    .select({
      semana: sql<number>`count(*) filter (where ${prayerLogs.fechaLocal} >= ${hace7})::int`,
      semanaPrevia: sql<number>`count(*) filter (where ${prayerLogs.fechaLocal} >= ${hace14} and ${prayerLogs.fechaLocal} < ${hace7})::int`,
    })
    .from(prayerLogs);

  const hace7ts = new Date(`${hace7}T00:00:00Z`);
  const hace14ts = new Date(`${hace14}T00:00:00Z`);

  const [promesasFila] = await db
    .select({
      semana: sql<number>`count(*) filter (where ${promises.createdAt} >= ${hace7ts})::int`,
      semanaPrevia: sql<number>`count(*) filter (where ${promises.createdAt} >= ${hace14ts} and ${promises.createdAt} < ${hace7ts})::int`,
    })
    .from(promises);

  const [acuerdosFila] = await db
    .select({
      semana: sql<number>`count(*) filter (where ${coupleAgreements.createdAt} >= ${hace7ts})::int`,
      semanaPrevia: sql<number>`count(*) filter (where ${coupleAgreements.createdAt} >= ${hace14ts} and ${coupleAgreements.createdAt} < ${hace7ts})::int`,
    })
    .from(coupleAgreements);

  const [afirmacionesFila] = await db
    .select({
      semana: sql<number>`count(*) filter (where ${affirmations.createdAt} >= ${hace7ts})::int`,
      semanaPrevia: sql<number>`count(*) filter (where ${affirmations.createdAt} >= ${hace14ts} and ${affirmations.createdAt} < ${hace7ts})::int`,
    })
    .from(affirmations);

  const [checkinsFila] = await db
    .select({
      semana: sql<number>`count(*) filter (where ${checkinResponses.createdAt} >= ${hace7ts})::int`,
      semanaPrevia: sql<number>`count(*) filter (where ${checkinResponses.createdAt} >= ${hace14ts} and ${checkinResponses.createdAt} < ${hace7ts})::int`,
    })
    .from(checkinResponses);

  return [
    { modulo: "Devocional de pareja", estaSemana: devocionalPareja?.semana ?? 0, semanaPrevia: devocionalPareja?.semanaPrevia ?? 0 },
    { modulo: "Devocional personal", estaSemana: devocionalPersonal?.semana ?? 0, semanaPrevia: devocionalPersonal?.semanaPrevia ?? 0 },
    { modulo: "Oración", estaSemana: oracion?.semana ?? 0, semanaPrevia: oracion?.semanaPrevia ?? 0 },
    { modulo: "Promesas guardadas", estaSemana: promesasFila?.semana ?? 0, semanaPrevia: promesasFila?.semanaPrevia ?? 0 },
    { modulo: "Acuerdos propuestos", estaSemana: acuerdosFila?.semana ?? 0, semanaPrevia: acuerdosFila?.semanaPrevia ?? 0 },
    { modulo: "Afirmaciones enviadas", estaSemana: afirmacionesFila?.semana ?? 0, semanaPrevia: afirmacionesFila?.semanaPrevia ?? 0 },
    { modulo: "Check-ins respondidos", estaSemana: checkinsFila?.semana ?? 0, semanaPrevia: checkinsFila?.semanaPrevia ?? 0 },
  ];
}
