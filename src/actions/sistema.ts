"use server";

import { headers } from "next/headers";
import { requerirAdmin } from "@/server/admin-session";
import { registrarEvento } from "@/server/modules/auditoria";
import { comprobarConexiones, type Comprobacion } from "@/server/modules/sistema";
import { enviarEmail, plantillaPrueba } from "@/server/email";

async function ip() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null
  );
}

/**
 * Hace peticiones reales a la base, a SendGrid, a S3 y a la API bíblica,
 * y la de S3 escribe un archivo diminuto y lo borra. Por eso va bajo
 * demanda y deja constancia, en lugar de ejecutarse en cada carga de página.
 */
export async function comprobarSistema(): Promise<
  { ok: true; datos: Comprobacion[] } | { ok: false; error: string }
> {
  const sesion = await requerirAdmin(["admin", "soporte"]);

  const datos = await comprobarConexiones();

  await registrarEvento({
    actor: sesion.email,
    rol: sesion.rol,
    accion: "sistema.comprobar",
    ip: await ip(),
  });

  return { ok: true, datos };
}

/**
 * Manda un correo real, siempre a quien lo pide: así comprueba que el
 * remitente esté verificado de punta a punta sin poder usarse para escribir
 * a terceros.
 */
export async function enviarCorreoDePrueba(): Promise<
  { ok: true; para: string } | { ok: false; error: string }
> {
  const sesion = await requerirAdmin(["admin"]);

  try {
    const { texto, html } = plantillaPrueba();
    await enviarEmail({
      tipo: "prueba",
      para: sesion.email,
      asunto: "Prueba de correo de Intimate",
      texto,
      html,
    });

    await registrarEvento({
      actor: sesion.email,
      rol: sesion.rol,
      accion: "sistema.correo_prueba",
      objetivo: sesion.email,
      ip: await ip(),
    });

    return { ok: true, para: sesion.email };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo enviar.",
    };
  }
}
