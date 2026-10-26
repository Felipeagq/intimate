import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { devotionals, devotionalResponses } from "../db/schema-app";
import { exigirMiembro } from "./pareja";
import { fechaLocal } from "./fecha";
import { registrarOracion } from "./oracion";

export type DevocionalPareja = {
  id: string;
  pasaje: string;
  titulo: string | null;
  textoPasaje: string | null;
  elegidoPorMi: boolean;
  miRespuesta: string | null;
  respuestaPareja: string | null;
  yoRespondi: boolean;
  parejaRespondio: boolean;
  /** Solo se revela cuando ambos escribieron. */
  revelado: boolean;
};

export async function devocionalDeParejaHoy(
  userId: string,
  coupleId: string,
  parejaId: string,
  zona: string,
): Promise<DevocionalPareja | null> {
  await exigirMiembro(userId, coupleId);

  const devocional = await db.query.devotionals.findFirst({
    where: and(
      eq(devotionals.coupleId, coupleId),
      eq(devotionals.scope, "pareja"),
      eq(devotionals.fechaLocal, fechaLocal(zona)),
    ),
  });

  if (!devocional) return null;

  const respuestas = await db
    .select()
    .from(devotionalResponses)
    .where(eq(devotionalResponses.devotionalId, devocional.id));

  const mia = respuestas.find((r) => r.autorId === userId);
  const suya = respuestas.find((r) => r.autorId === parejaId);
  const revelado = Boolean(mia && suya);

  return {
    id: devocional.id,
    pasaje: devocional.pasaje,
    titulo: devocional.titulo,
    textoPasaje: devocional.textoPasaje,
    elegidoPorMi: devocional.autorId === userId,
    miRespuesta: mia?.contenido ?? null,
    // La respuesta del otro no sale del servidor hasta que ambos escriban:
    // ocultarla solo en la interfaz dejaría el texto en el HTML.
    respuestaPareja: revelado ? (suya?.contenido ?? null) : null,
    yoRespondi: Boolean(mia),
    parejaRespondio: Boolean(suya),
    revelado,
  };
}

export async function crearDevocionalDePareja(
  userId: string,
  coupleId: string,
  zona: string,
  datos: { pasaje: string; titulo?: string; textoPasaje?: string },
) {
  await exigirMiembro(userId, coupleId);

  const [fila] = await db
    .insert(devotionals)
    .values({
      autorId: userId,
      coupleId,
      scope: "pareja",
      fechaLocal: fechaLocal(zona),
      pasaje: datos.pasaje,
      titulo: datos.titulo ?? null,
      textoPasaje: datos.textoPasaje ?? null,
    })
    .returning();

  return fila;
}

export async function guardarRespuesta(
  userId: string,
  devotionalId: string,
  contenido: string,
  zona: string,
) {
  const devocional = await db.query.devotionals.findFirst({
    where: eq(devotionals.id, devotionalId),
  });
  if (!devocional?.coupleId) throw new Error("Devocional no encontrado.");
  await exigirMiembro(userId, devocional.coupleId);

  await db.transaction(async (tx) => {
    await tx
      .insert(devotionalResponses)
      .values({ devotionalId, autorId: userId, contenido })
      .onConflictDoUpdate({
        target: [devotionalResponses.devotionalId, devotionalResponses.autorId],
        set: { contenido, updatedAt: new Date() },
      });
  });

  // Un devocional de pareja también cuenta como oración del día.
  await registrarOracion(userId, zona, { origen: "devocional" });
}

// ------------------------------------------------------ Devocional personal

export async function devocionalPersonalAbierto(userId: string, zona: string) {
  return db.query.devotionals.findFirst({
    where: and(
      eq(devotionals.autorId, userId),
      eq(devotionals.scope, "personal"),
      eq(devotionals.fechaLocal, fechaLocal(zona)),
    ),
  });
}

/**
 * Guarda el borrador del SOAP. Se llama en cada paso, así que cerrar la app
 * a mitad y volver deja el devocional donde estaba.
 */
export async function guardarDevocionalPersonal(
  userId: string,
  zona: string,
  datos: {
    pasaje: string;
    textoPasaje?: string;
    observacion?: string;
    aplicacion?: string;
    oracion?: string;
    completado?: boolean;
  },
) {
  const hoy = fechaLocal(zona);
  const existente = await devocionalPersonalAbierto(userId, zona);

  const valores = {
    pasaje: datos.pasaje,
    textoPasaje: datos.textoPasaje ?? null,
    observacion: datos.observacion ?? null,
    aplicacion: datos.aplicacion ?? null,
    oracion: datos.oracion ?? null,
    completado: datos.completado ?? false,
    updatedAt: new Date(),
  };

  const fila = existente
    ? (
        await db
          .update(devotionals)
          .set(valores)
          .where(eq(devotionals.id, existente.id))
          .returning()
      )[0]
    : (
        await db
          .insert(devotionals)
          .values({
            autorId: userId,
            scope: "personal",
            fechaLocal: hoy,
            ...valores,
          })
          .returning()
      )[0];

  // Cuenta para la racha solo si incluye la sección Oración, como define
  // el documento.
  if (datos.completado && datos.oracion?.trim()) {
    await registrarOracion(userId, zona, { origen: "devocional" });
  }

  return fila;
}

export async function historialDevocionales(userId: string, limite = 30) {
  return db
    .select()
    .from(devotionals)
    .where(
      and(eq(devotionals.autorId, userId), eq(devotionals.scope, "personal")),
    )
    .orderBy(desc(devotionals.fechaLocal))
    .limit(limite);
}
