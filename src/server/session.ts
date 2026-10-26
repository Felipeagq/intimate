import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function obtenerSesion() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Para páginas que exigen sesión. El middleware es solo la primera barrera:
 * cada punto de entrada vuelve a verificar, porque confiar únicamente en el
 * matcher del middleware deja rutas expuestas si se configura mal.
 */
export async function requerirSesion() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/entrar");
  return sesion;
}
