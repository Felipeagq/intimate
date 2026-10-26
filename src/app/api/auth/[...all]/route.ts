import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

// Runtime Node: Amplify no soporta el runtime edge en route handlers.
export const runtime = "nodejs";

export const { GET, POST } = toNextJsHandler(auth);
