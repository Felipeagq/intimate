import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { obtenerPareja, type ParejaActiva } from "./modules/pareja";

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

export type ContextoApp = {
  userId: string;
  email: string;
  nombre: string;
  zona: string;
  pareja: ParejaActiva | null;
};

/** Lo que casi todas las pantallas necesitan: quién eres y con quién estás. */
export async function contextoApp(): Promise<ContextoApp> {
  const sesion = await requerirSesion();

  const u = sesion.user as typeof sesion.user & {
    zonaHoraria?: string | null;
    estado?: string | null;
  };

  // Una cuenta suspendida no debe poder seguir usando la app.
  if (u.estado && u.estado !== "activa") redirect("/cuenta-suspendida");

  const zona = u.zonaHoraria || "America/Bogota";

  return {
    userId: u.id,
    email: u.email,
    nombre: u.name?.trim().split(" ")[0] || capitalizar(u.email.split("@")[0]),
    zona,
    pareja: await obtenerPareja(u.id, zona),
  };
}

function capitalizar(texto: string) {
  const limpio = texto.replace(/[._-]+/g, " ").trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
