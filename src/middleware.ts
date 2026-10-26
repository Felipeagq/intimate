import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Primera barrera, no la única. Solo mira que exista la cookie: no valida
 * la sesión contra la base, porque eso costaría una consulta en cada
 * navegación. La verificación real la hace `requerirSesion()` en el layout,
 * y cada caso de uso vuelve a comprobar los permisos.
 */
export function middleware(request: NextRequest) {
  const cookie = getSessionCookie(request, { cookiePrefix: "intimate" });

  if (!cookie) {
    const destino = new URL("/entrar", request.url);
    destino.searchParams.set("volver", request.nextUrl.pathname);
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
  ],
};
