"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirAdmin, type SesionAdmin } from "@/server/admin-session";
import { registrarEvento, registrarLecturaUnica } from "@/server/modules/auditoria";
import * as adminModulo from "@/server/modules/admin";
import { desvincular, obtenerPareja } from "@/server/modules/pareja";
import * as equipoModulo from "@/server/modules/equipo";
import * as soporteModulo from "@/server/modules/soporte";
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
 * Deja constancia de que alguien del equipo miró algo ajeno. Una vez por
 * ventana de cinco minutos: ver `registrarLecturaUnica`.
 */
async function registrarLectura(accion: string, objetivo: string) {
  const sesion = await requerirAdmin(["admin", "soporte"]);
  await registrarLecturaUnica({
    actor: sesion.email,
    rol: sesion.rol,
    accion,
    objetivo,
    ip: await ipDeLaPeticion(),
  });
}

export async function registrarConsulta(email: string) {
  await registrarLectura("cuenta.consultar", email);
}

/** Leer un mensaje de soporte también es mirar algo que la persona escribió. */
export async function registrarLecturaMensaje(email: string) {
  await registrarLectura("soporte.mensaje_leido", email);
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

// ------------------------------------------------------------------ Bandeja

const esquemaEstadoMensaje = z.enum(["nuevo", "en_curso", "resuelto"]);

/** Las acciones sobre la bandeja las pueden hacer admin y soporte. */
const ROLES_BANDEJA: ("admin" | "soporte")[] = ["admin", "soporte"];

function rutasMensaje(id: string) {
  return ["/admin/bandeja", `/admin/bandeja/${id}`];
}

export async function cambiarEstadoMensaje(
  id: string,
  estado: z.infer<typeof esquemaEstadoMensaje>,
) {
  const validado = esquemaEstadoMensaje.parse(estado);
  return ejecutarConAuditoria(
    ROLES_BANDEJA,
    `soporte.mensaje_${validado}`,
    null,
    () => soporteModulo.cambiarEstadoTicket(id, validado),
    rutasMensaje(id),
  );
}

export async function asignarMensaje(id: string, tomarlo: boolean) {
  return ejecutarConAuditoria(
    ROLES_BANDEJA,
    tomarlo ? "soporte.mensaje_tomado" : "soporte.mensaje_soltado",
    null,
    (sesion) => soporteModulo.asignarTicket(id, tomarlo ? sesion.email : null),
    rutasMensaje(id),
  );
}

/** La nota queda en el mensaje; en auditoría solo consta que se escribió. */
export async function agregarNotaMensaje(id: string, contenido: string) {
  return ejecutarConAuditoria(
    ROLES_BANDEJA,
    "soporte.nota",
    null,
    (sesion) => soporteModulo.agregarNota(id, sesion.email, contenido),
    rutasMensaje(id),
  );
}

export async function responderMensaje(id: string, respuesta: string) {
  return ejecutarConAuditoria(
    ROLES_BANDEJA,
    "soporte.respuesta",
    null,
    (sesion) => soporteModulo.responderTicket(id, sesion.email, respuesta),
    rutasMensaje(id),
  );
}
