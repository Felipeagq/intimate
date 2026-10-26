import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  coupleAgreements,
  agreementConfirmations,
  affirmations,
} from "../db/schema-app";
import { exigirMiembro } from "./pareja";

export type AcuerdoConEstado = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  proximaRevision: string | null;
  confirmadoPorMi: boolean;
  confirmadoPorAmbos: boolean;
  createdAt: Date;
};

export async function listarAcuerdos(
  userId: string,
  coupleId: string,
): Promise<AcuerdoConEstado[]> {
  await exigirMiembro(userId, coupleId);

  const filas = await db.query.coupleAgreements.findMany({
    where: eq(coupleAgreements.coupleId, coupleId),
    orderBy: [desc(coupleAgreements.createdAt)],
    with: { confirmaciones: true },
  });

  return filas.map((a) => ({
    id: a.id,
    titulo: a.titulo,
    descripcion: a.descripcion,
    estado: a.estado,
    proximaRevision: a.proximaRevision,
    confirmadoPorMi: a.confirmaciones.some((c) => c.userId === userId),
    confirmadoPorAmbos: a.confirmaciones.length >= 2,
    createdAt: a.createdAt,
  }));
}

/** Quien lo propone lo confirma de entrada; falta la otra persona. */
export async function crearAcuerdo(
  userId: string,
  coupleId: string,
  datos: { titulo: string; descripcion?: string; proximaRevision?: string },
) {
  await exigirMiembro(userId, coupleId);

  return db.transaction(async (tx) => {
    const [acuerdo] = await tx
      .insert(coupleAgreements)
      .values({
        coupleId,
        titulo: datos.titulo,
        descripcion: datos.descripcion ?? null,
        proximaRevision: datos.proximaRevision ?? null,
        creadoPor: userId,
        estado: "en revisión",
      })
      .returning();

    await tx
      .insert(agreementConfirmations)
      .values({ agreementId: acuerdo.id, userId });

    return acuerdo;
  });
}

/**
 * Confirmar un acuerdo.
 *
 * Insertar la confirmación y pasar el acuerdo a vigente ocurre dentro de una
 * transacción: si lo segundo fallara, quedaría una confirmación registrada
 * sobre un acuerdo que nadie considera vigente.
 */
export async function confirmarAcuerdo(
  userId: string,
  coupleId: string,
  acuerdoId: string,
) {
  await exigirMiembro(userId, coupleId);

  return db.transaction(async (tx) => {
    const acuerdo = await tx.query.coupleAgreements.findFirst({
      where: and(
        eq(coupleAgreements.id, acuerdoId),
        eq(coupleAgreements.coupleId, coupleId),
      ),
      with: { confirmaciones: true },
    });
    if (!acuerdo) throw new Error("No encontramos ese acuerdo.");

    await tx
      .insert(agreementConfirmations)
      .values({ agreementId: acuerdoId, userId })
      .onConflictDoNothing();

    const confirmantes = new Set([
      ...acuerdo.confirmaciones.map((c) => c.userId),
      userId,
    ]);

    if (confirmantes.size >= 2) {
      await tx
        .update(coupleAgreements)
        .set({ estado: "vigente", updatedAt: new Date() })
        .where(eq(coupleAgreements.id, acuerdoId));
    }

    return { vigente: confirmantes.size >= 2 };
  });
}

/** Cambiar un acuerdo vigente lo devuelve a revisión: los dos vuelven a confirmar. */
export async function proponerCambio(
  userId: string,
  coupleId: string,
  acuerdoId: string,
  datos: { titulo?: string; descripcion?: string },
) {
  await exigirMiembro(userId, coupleId);

  return db.transaction(async (tx) => {
    await tx
      .delete(agreementConfirmations)
      .where(eq(agreementConfirmations.agreementId, acuerdoId));

    const [fila] = await tx
      .update(coupleAgreements)
      .set({
        ...(datos.titulo ? { titulo: datos.titulo } : {}),
        ...(datos.descripcion !== undefined
          ? { descripcion: datos.descripcion }
          : {}),
        estado: "en revisión",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(coupleAgreements.id, acuerdoId),
          eq(coupleAgreements.coupleId, coupleId),
        ),
      )
      .returning();

    if (!fila) throw new Error("No encontramos ese acuerdo.");

    await tx
      .insert(agreementConfirmations)
      .values({ agreementId: acuerdoId, userId });

    return fila;
  });
}

// ----------------------------------------------------------- Afirmaciones

export async function listarAfirmaciones(userId: string, coupleId: string) {
  await exigirMiembro(userId, coupleId);

  return db
    .select()
    .from(affirmations)
    .where(eq(affirmations.coupleId, coupleId))
    .orderBy(desc(affirmations.createdAt))
    .limit(50);
}

export async function enviarAfirmacion(
  userId: string,
  coupleId: string,
  paraId: string,
  mensaje: string,
) {
  await exigirMiembro(userId, coupleId);

  const [fila] = await db
    .insert(affirmations)
    .values({ coupleId, deId: userId, paraId, mensaje })
    .returning();
  return fila;
}

/** Solo quien recibe puede marcarla como favorita. */
export async function alternarFavorita(userId: string, afirmacionId: string) {
  const fila = await db.query.affirmations.findFirst({
    where: and(
      eq(affirmations.id, afirmacionId),
      eq(affirmations.paraId, userId),
    ),
  });
  if (!fila) throw new Error("No encontramos esa afirmación.");

  const [actualizada] = await db
    .update(affirmations)
    .set({ favorita: !fila.favorita })
    .where(eq(affirmations.id, afirmacionId))
    .returning();

  return actualizada;
}
