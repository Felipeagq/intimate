import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db/client";
import { user } from "./db/schema";
import { obtenerPareja, type ParejaActiva } from "./modules/pareja";
import { urlsDeFotos } from "./modules/almacenamiento";

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
  /** Primer nombre, para saludar. */
  nombre: string;
  /** Tal como lo escribió, para los formularios. */
  nombreCompleto: string;
  telefono: string | null;
  zona: string;
  /** Enlace firmado, caduca en una hora. */
  fotoUrl: string | null;
  parejaFotoUrl: string | null;
  pareja: ParejaActiva | null;
};

/** Lo que casi todas las pantallas necesitan: quién eres y con quién estás. */
export async function contextoApp(): Promise<ContextoApp> {
  const sesion = await requerirSesion();

  // El perfil se lee de la base, no del payload de la sesión: la cookie se
  // cachea cinco minutos y un cambio de nombre o de foto no se vería hasta
  // que caducara. La sesión sirve para autenticar; los datos, para mostrar.
  const perfil = await db.query.user.findFirst({
    where: eq(user.id, sesion.user.id),
    columns: {
      id: true,
      email: true,
      name: true,
      image: true,
      telefono: true,
      zonaHoraria: true,
      estado: true,
    },
  });

  if (!perfil) redirect("/entrar");

  // Una cuenta suspendida no debe poder seguir usando la app.
  if (perfil.estado && perfil.estado !== "activa") {
    redirect("/cuenta-suspendida");
  }

  const zona = perfil.zonaHoraria || "America/Bogota";
  const pareja = await obtenerPareja(perfil.id, zona);

  // Las dos se firman juntas para no pagar dos viajes separados.
  const [fotoUrl, parejaFotoUrl] = await urlsDeFotos([
    perfil.image ?? null,
    pareja?.parejaFoto ?? null,
  ]);

  const nombreCompleto = perfil.name?.trim() ?? "";

  return {
    userId: perfil.id,
    email: perfil.email,
    nombre:
      nombreCompleto.split(" ")[0] || capitalizar(perfil.email.split("@")[0]),
    nombreCompleto,
    telefono: perfil.telefono ?? null,
    zona,
    fotoUrl,
    parejaFotoUrl,
    pareja,
  };
}

function capitalizar(texto: string) {
  const limpio = texto.replace(/[._-]+/g, " ").trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
