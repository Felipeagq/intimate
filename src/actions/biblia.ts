"use server";

import { z } from "zod";
import { contextoApp } from "@/server/session";
import {
  buscarPasaje as buscar,
  type ResultadoPasaje,
} from "@/server/modules/biblia";

const esquema = z.object({
  referencia: z.string().max(80),
  uso: z.enum(["devocional", "promesa"]),
});

/**
 * Solo con sesión: cada consulta que no esté en la base sale hacia un
 * servicio externo, y no hay motivo para dejar que cualquiera lo use.
 */
export async function buscarPasaje(
  referencia: string,
  uso: "devocional" | "promesa" = "devocional",
): Promise<ResultadoPasaje> {
  await contextoApp();

  const datos = esquema.safeParse({ referencia, uso });
  if (!datos.success) return { ok: false, error: "Esa cita no es válida." };

  return buscar(datos.data.referencia, datos.data.uso);
}
