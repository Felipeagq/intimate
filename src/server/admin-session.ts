import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authAdmin, type Rol, ROLES } from "./auth-admin";

export type SesionAdmin = {
  usuarioId: string;
  email: string;
  nombre: string;
  rol: Rol;
  dobleFactorActivo: boolean;
};

export async function obtenerSesionAdmin(): Promise<SesionAdmin | null> {
  const sesion = await authAdmin.api.getSession({ headers: await headers() });
  if (!sesion) return null;

  const u = sesion.user as typeof sesion.user & {
    rol?: string;
    twoFactorEnabled?: boolean | null;
  };

  const rol = (ROLES as readonly string[]).includes(u.rol ?? "")
    ? (u.rol as Rol)
    : "lectura";

  return {
    usuarioId: u.id,
    email: u.email,
    nombre: u.name,
    rol,
    dobleFactorActivo: Boolean(u.twoFactorEnabled),
  };
}

/**
 * Puerta de entrada al panel.
 *
 * El middleware solo mira que exista la cookie; aquí se valida la sesión de
 * verdad, se exige el segundo factor y se comprueba el rol. Cada caso de uso
 * que modifique datos debe volver a llamar a esto con los roles que admite:
 * un usuario con rol lectura tiene que recibir un rechazo aunque llame
 * directamente a la Server Action.
 */
export async function requerirAdmin(
  rolesPermitidos: readonly Rol[] = ROLES,
): Promise<SesionAdmin> {
  const sesion = await obtenerSesionAdmin();
  if (!sesion) redirect("/admin/entrar");

  // MFA obligatorio para todo el equipo: sin segundo factor no se entra.
  if (!sesion.dobleFactorActivo) redirect("/admin/configurar-mfa");

  if (!rolesPermitidos.includes(sesion.rol)) redirect("/admin/sin-permiso");

  return sesion;
}

export function puede(rol: Rol, accion: "ver" | "operar" | "administrar") {
  if (accion === "ver") return true;
  if (accion === "operar") return rol === "admin" || rol === "soporte";
  return rol === "admin";
}
