"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { contextoApp } from "@/server/session";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";
import {
  borrarFoto,
  claveEsDelUsuario,
  firmarSubidaDeFoto,
} from "@/server/modules/almacenamiento";
import { almacenamientoHabilitado } from "@/server/env";

type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string };

const RUTAS = ["/ajustes", "/inicio", "/pareja"];

/** Paso 1: el servidor firma el permiso, el navegador sube directo a S3. */
export async function pedirPermisoDeSubida(
  tipo: string,
  tamano: number,
): Promise<Resultado<{ url: string; clave: string }>> {
  try {
    const ctx = await contextoApp();

    if (!almacenamientoHabilitado) {
      return {
        ok: false,
        error: "Las fotos todavía no están configuradas en este entorno.",
      };
    }

    const datos = await firmarSubidaDeFoto(
      ctx.userId,
      z.string().parse(tipo),
      z.number().int().positive().parse(tamano),
    );

    return { ok: true, datos };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No pudimos preparar la subida.",
    };
  }
}

/** Paso 2: confirmada la subida, se guarda la ruta y se borra la anterior. */
export async function confirmarFoto(clave: string): Promise<Resultado<null>> {
  try {
    const ctx = await contextoApp();

    // La ruta la generó el servidor, pero llega de vuelta desde el cliente:
    // se vuelve a comprobar que pertenezca a quien la envía.
    if (!claveEsDelUsuario(clave, ctx.userId)) {
      return { ok: false, error: "Esa imagen no te pertenece." };
    }

    const actual = await db.query.user.findFirst({
      where: eq(user.id, ctx.userId),
      columns: { image: true },
    });

    await db
      .update(user)
      .set({ image: clave, updatedAt: new Date() })
      .where(eq(user.id, ctx.userId));

    // Después de guardar: si fallara, el usuario se queda sin foto nueva
    // y con la vieja borrada.
    if (actual?.image && actual.image !== clave) {
      await borrarFoto(actual.image);
    }

    for (const ruta of RUTAS) revalidatePath(ruta);
    return { ok: true, datos: null };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No pudimos guardar la foto.",
    };
  }
}

export async function quitarFoto(): Promise<Resultado<null>> {
  try {
    const ctx = await contextoApp();

    const actual = await db.query.user.findFirst({
      where: eq(user.id, ctx.userId),
      columns: { image: true },
    });

    await db
      .update(user)
      .set({ image: null, updatedAt: new Date() })
      .where(eq(user.id, ctx.userId));

    if (actual?.image) await borrarFoto(actual.image);

    for (const ruta of RUTAS) revalidatePath(ruta);
    return { ok: true, datos: null };
  } catch {
    return { ok: false, error: "No pudimos quitar la foto." };
  }
}
