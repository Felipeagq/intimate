"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { contextoApp } from "@/server/session";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { esZonaValida } from "@/server/modules/zona";

type Resultado = { ok: true } | { ok: false; error: string };

const esquema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Escribe al menos dos letras.")
    .max(60, "El nombre es demasiado largo."),
  /**
   * Formato E.164: un "+", el código de país y hasta quince dígitos. Se
   * guarda normalizado para que luego sirva tal cual en Twilio, sin tener
   * que adivinar el país de cada persona.
   */
  telefono: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .refine((v) => v === "" || /^\+[1-9]\d{7,14}$/.test(v), {
      message: "Escribe el teléfono con código de país, por ejemplo +573001234567.",
    })
    .optional(),
});

export async function actualizarPerfil(entrada: {
  nombre: string;
  telefono?: string;
}): Promise<Resultado> {
  try {
    const ctx = await contextoApp();
    const datos = esquema.parse(entrada);

    await db
      .update(user)
      .set({
        name: datos.nombre,
        telefono: datos.telefono || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, ctx.userId));

    // El nombre y la foto se ven en todas estas pantallas.
    for (const ruta of ["/ajustes", "/inicio", "/pareja", "/devocional"]) {
      revalidatePath(ruta);
    }

    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? "Datos inválidos." };
    }
    return { ok: false, error: "No pudimos guardar los cambios." };
  }
}

/**
 * Fija la zona horaria.
 *
 * `automatica` viene de la detección del navegador. En ese caso solo se
 * aplica si la persona todavía no confirmó ninguna: si ya eligió una a
 * mano, un viaje o un navegador mal configurado no puede cambiársela sin
 * avisar, porque eso mueve el día en que cuenta cada oración.
 */
export async function fijarZonaHoraria(
  zona: string,
  automatica: boolean,
): Promise<Resultado> {
  try {
    const ctx = await contextoApp();

    if (!esZonaValida(zona)) {
      return { ok: false, error: "Esa zona horaria no es válida." };
    }

    if (automatica && ctx.zonaConfirmada) return { ok: true };

    await db
      .update(user)
      .set({ zonaHoraria: zona, zonaConfirmada: true, updatedAt: new Date() })
      .where(eq(user.id, ctx.userId));

    for (const ruta of ["/ajustes", "/inicio", "/oracion", "/pareja"]) {
      revalidatePath(ruta);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "No pudimos guardar la zona horaria." };
  }
}
