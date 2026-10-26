"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { contextoApp } from "@/server/session";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";

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
