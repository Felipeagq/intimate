"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirAdmin } from "@/server/admin-session";
import { registrarEvento } from "@/server/modules/auditoria";
import * as adminModulo from "@/server/modules/admin";

export type Resultado = { ok: true } | { ok: false; error: string };

async function ipDeLaPeticion() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

/**
 * Toda acción del panel pasa por aquí.
 *
 * Vuelve a exigir el rol aunque el menú ya lo haya ocultado: un usuario con
 * rol lectura tiene que recibir un rechazo incluso si llama directamente a
 * la Server Action. Y cada acción que modifica datos deja un evento de
 * auditoría, sin excepción.
 */
async function ejecutarConAuditoria(
  rolesPermitidos: ("admin" | "soporte" | "lectura")[],
  accion: string,
  objetivo: string | null,
  fn: () => Promise<{ email?: string } | void>,
  rutas: string[] = [],
): Promise<Resultado> {
  const sesion = await requerirAdmin(rolesPermitidos);

  try {
    const resultado = await fn();

    await registrarEvento({
      actor: sesion.email,
      rol: sesion.rol,
      accion,
      objetivo: resultado?.email ?? objetivo,
      ip: await ipDeLaPeticion(),
    });

    for (const ruta of rutas) revalidatePath(ruta);
    return { ok: true };
  } catch (e) {
    await registrarEvento({
      actor: sesion.email,
      rol: sesion.rol,
      accion: `${accion}.fallida`,
      objetivo,
      ip: await ipDeLaPeticion(),
    });

    if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
      return { ok: false, error: e.message };
    }
    throw e;
  }
}

const esquemaEstado = z.enum(["activa", "suspendida", "eliminación pendiente"]);

export async function cambiarEstadoCuenta(
  usuarioId: string,
  estado: z.infer<typeof esquemaEstado>,
) {
  const validado = esquemaEstado.parse(estado);

  return ejecutarConAuditoria(
    ["admin", "soporte"],
    `cuenta.${validado === "activa" ? "reactivar" : validado === "suspendida" ? "suspender" : "eliminar"}`,
    usuarioId,
    () => adminModulo.cambiarEstadoCuenta(usuarioId, validado),
    ["/admin/soporte", "/admin/auditoria"],
  );
}

/** Dejar constancia de que alguien consultó una cuenta ajena. */
export async function registrarConsulta(usuarioId: string) {
  return ejecutarConAuditoria(
    ["admin", "soporte"],
    "cuenta.consultar",
    usuarioId,
    async () => {},
  );
}
