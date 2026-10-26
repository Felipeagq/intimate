import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/** Pantallas del panel accesibles sin sesión del equipo. */
const RUTAS_ADMIN_PUBLICAS = [
  "/admin/entrar",
  "/admin/verificar",
  "/admin/configurar-mfa",
  "/admin/sin-permiso",
];

/**
 * Primera barrera, no la única. Solo comprueba que exista la cookie: no
 * valida la sesión contra la base, porque eso costaría una consulta en cada
 * navegación. La verificación real, el segundo factor y el rol los resuelven
 * `requerirSesion()` y `requerirAdmin()` en los layouts, y cada caso de uso
 * vuelve a comprobar permisos.
 *
 * Las dos cookies son distintas a propósito: la de la app no abre el panel
 * ni la del panel abre la app.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (RUTAS_ADMIN_PUBLICAS.some((r) => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    const cookieAdmin = getSessionCookie(request, {
      cookiePrefix: "intimate_admin",
    });

    if (!cookieAdmin) {
      return NextResponse.redirect(new URL("/admin/entrar", request.url));
    }

    return NextResponse.next();
  }

  const cookieApp = getSessionCookie(request, { cookiePrefix: "intimate" });

  if (!cookieApp) {
    const destino = new URL("/entrar", request.url);
    destino.searchParams.set("volver", pathname);
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/inicio/:path*",
    "/devocional/:path*",
    "/oracion/:path*",
    "/promesas/:path*",
    "/pareja/:path*",
    "/vincular/:path*",
    "/ajustes/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
