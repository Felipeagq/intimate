import { toNextJsHandler } from "better-auth/next-js";
import { authAdmin } from "@/server/auth-admin";

export const runtime = "nodejs";

// Ruta distinta a la de la app a propósito: /api/auth es para usuarios,
// /api/admin-auth para el equipo. No comparten cookie ni tablas.
export const { GET, POST } = toNextJsHandler(authAdmin);
