"use server";

import { contextoApp } from "@/server/session";
import { crearTicket } from "@/server/modules/soporte";

export type Resultado = { ok: true } | { ok: false; error: string };

function mensajeDeError(e: unknown) {
  return e instanceof Error ? e.message : "No pudimos enviar tu mensaje. Inténtalo de nuevo.";
}

/** Desde Ajustes: hay sesión, así que el correo es el de la cuenta. */
export async function enviarMensajeApp(
  categoria: string,
  mensaje: string,
): Promise<Resultado> {
  const ctx = await contextoApp();

  try {
    await crearTicket({
      email: ctx.email,
      userId: ctx.userId,
      categoria,
      mensaje,
      verificado: true,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) };
  }
}

/**
 * Desde la página pública /ayuda, sin sesión: la necesita quien tiene la
 * cuenta suspendida o ya no puede entrar.
 *
 * `trampa` es un campo oculto que una persona no ve y un robot sí rellena.
 * Si viene con algo, se responde "ok" sin crear nada: así el robot no sabe
 * que lo detectamos.
 */
export async function enviarMensajePublico(
  email: string,
  categoria: string,
  mensaje: string,
  trampa: string,
): Promise<Resultado> {
  if (trampa) return { ok: true };

  try {
    await crearTicket({ email, categoria, mensaje, verificado: false });
    // La misma respuesta exista o no una cuenta con ese correo: otra cosa
    // revelaría qué correos están registrados.
    return { ok: true };
  } catch (e) {
    return { ok: false, error: mensajeDeError(e) };
  }
}
