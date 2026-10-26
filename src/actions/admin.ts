"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirAdmin, type SesionAdmin } from "@/server/admin-session";
import { registrarEvento } from "@/server/modules/auditoria";
import * as adminModulo from "@/server/modules/admin";
import { desvincular, obtenerPareja } from "@/server/modules/pareja";
import * as equipoModulo from "@/server/modules/equipo";
import { ROLES, type Rol } from "@/server/auth-admin";

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
  fn: (sesion: SesionAdmin) => Promise<{ email?: string } | void>,
  rutas: string[] = [],
): Promise<Resultado> {
  const sesion = await requerirAdmin(rolesPermitidos);

  try {
    const resultado = await fn(sesion);

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
    ["/admin/soporte", "/admin/auditoria", `/admin/soporte/${usuarioId}`],
  );
}

/**
 * Deja constancia de que alguien del equipo consultó una cuenta ajena.
 * Se llama desde la vista de detalle en cada carga, así cada mirada queda
 * registrada, no solo las acciones que modifican algo.
 */
export async function registrarConsulta(email: string) {
  return ejecutarConAuditoria(
    ["admin", "soporte"],
    "cuenta.consultar",
    email,
    async () => {},
  );
}

/**
 * Desvincula una pareja a petición de soporte, sin pasar por ninguno de
 * los dos usuarios. Pensado para un reporte de abuso: la persona afectada
 * no tiene que esperar a que la otra parte haga algo, ni dar aviso.
 */
export async function forzarDesvinculacion(usuarioId: string) {
  return ejecutarConAuditoria(
    ["admin", "soporte"],
    "pareja.forzar_desvinculacion",
    null,
    async () => {
      const pareja = await obtenerPareja(usuarioId, "UTC");
      if (!pareja) throw new Error("Esta cuenta no tiene una pareja activa.");

      await desvincular(usuarioId);

      // El objetivo queda como "correoA ↔ correoB" para que el evento
      // aparezca en el historial de las dos cuentas, no solo de una.
      const cuenta = await adminModulo.obtenerDetalleCuenta(usuarioId);
      return { email: `${cuenta?.email ?? usuarioId} ↔ ${pareja.parejaEmail}` };
    },
    ["/admin/soporte", "/admin/auditoria"],
  );
}

const esquemaInvitacion = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  rol: z.enum(ROLES),
});

/** Solo admin invita: dar de alta cuentas del equipo es el permiso más alto. */
export async function crearInvitacionEquipo(email: string, rol: Rol) {
  return ejecutarConAuditoria(
    ["admin"],
    "equipo.invitar",
    email,
    async (sesion) => {
      const datos = esquemaInvitacion.parse({ email, rol });
      await equipoModulo.crearInvitacionEquipo(
        sesion.usuarioId,
        sesion.email,
        datos.email,
        datos.rol,
      );
      return { email: datos.email };
    },
    ["/admin/configuracion"],
  );
}

export async function revocarInvitacionEquipo(inviteId: string) {
  return ejecutarConAuditoria(
    ["admin"],
    "equipo.invitacion_revocada",
    inviteId,
    () => equipoModulo.revocarInvitacion(inviteId),
    ["/admin/configuracion"],
  );
}
