"use server";

import { z } from "zod";
import {
  verificarInvitacion,
  aceptarInvitacionEquipo as aceptarModulo,
} from "@/server/modules/equipo";
import { registrarEvento } from "@/server/modules/auditoria";

export type Resultado = { ok: true } | { ok: false; error: string };

/**
 * Acciones de la pantalla pública de aceptación. No pasan por
 * `requerirAdmin`: quien las llama todavía no tiene ninguna sesión, por
 * definición. La única comprobación es que el token sea válido.
 */

export async function verificarInvitacionEquipo(token: string) {
  return verificarInvitacion(token);
}

const esquema = z.object({
  token: z.string().min(1),
  contrasena: z.string().min(12, "La contraseña debe tener al menos 12 caracteres."),
});

export async function aceptarInvitacionEquipo(
  token: string,
  contrasena: string,
): Promise<Resultado> {
  try {
    const datos = esquema.parse({ token, contrasena });
    const { email } = await aceptarModulo(datos.token, datos.contrasena);

    // El actor es la propia cuenta nueva: no hay sesión de admin todavía
    // que la haya creado, la creó quien aceptó la invitación.
    await registrarEvento({
      actor: email,
      rol: "sistema",
      accion: "equipo.cuenta_creada",
      objetivo: email,
    });

    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? "Datos inválidos." };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No pudimos crear la cuenta.",
    };
  }
}
