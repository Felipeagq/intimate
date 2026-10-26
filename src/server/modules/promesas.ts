import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { promises } from "../db/schema-app";
import { fechaLocal } from "./fecha";

export async function listarPromesas(userId: string) {
  return db
    .select()
    .from(promises)
    .where(eq(promises.autorId, userId))
    .orderBy(desc(promises.createdAt));
}

export async function crearPromesa(
  userId: string,
  datos: {
    cita: string;
    texto: string;
    contexto?: string;
    etiquetas?: string[];
  },
) {
  const [fila] = await db
    .insert(promises)
    .values({
      autorId: userId,
      cita: datos.cita,
      texto: datos.texto,
      contexto: datos.contexto ?? null,
      etiquetas: datos.etiquetas ?? [],
    })
    .returning();
  return fila;
}

export async function marcarCumplida(
  userId: string,
  promesaId: string,
  testimonio?: string,
) {
  const [fila] = await db
    .update(promises)
    .set({
      cumplida: true,
      cumplidaEn: new Date(),
      testimonio: testimonio ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(promises.id, promesaId), eq(promises.autorId, userId)))
    .returning();

  if (!fila) throw new Error("No encontramos esa promesa.");
  return fila;
}

/**
 * Promesa del día.
 *
 * No se repite hasta recorrer todo el banco: se elige entre las que nunca
 * se han mostrado y, cuando se acaban, se reinicia el ciclo. Si ya se
 * eligió una hoy, devuelve esa misma.
 */
export async function promesaDelDia(userId: string, zona: string) {
  const hoy = fechaLocal(zona);

  const yaElegida = await db.query.promises.findFirst({
    where: and(eq(promises.autorId, userId), eq(promises.mostradaEn, hoy)),
  });
  if (yaElegida) return yaElegida;

  const pendiente = await db.query.promises.findFirst({
    where: and(
      eq(promises.autorId, userId),
      or(isNull(promises.mostradaEn), sql`${promises.mostradaEn} < ${hoy}`),
    ),
    orderBy: [asc(promises.mostradaEn), asc(promises.createdAt)],
  });

  if (!pendiente) return null;

  await db
    .update(promises)
    .set({ mostradaEn: hoy })
    .where(eq(promises.id, pendiente.id));

  return { ...pendiente, mostradaEn: hoy };
}

export async function contarPromesas(userId: string) {
  const [fila] = await db
    .select({
      total: sql<number>`count(*)::int`,
      cumplidas: sql<number>`count(*) filter (where ${promises.cumplida})::int`,
    })
    .from(promises)
    .where(eq(promises.autorId, userId));

  return { total: fila?.total ?? 0, cumplidas: fila?.cumplidas ?? 0 };
}
