import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "@/server/env";
import * as schema from "./schema";
import * as adminSchema from "./schema-admin";
import * as appSchema from "./schema-app";
import * as auditSchema from "./schema-audit";

/**
 * Driver WebSocket, no HTTP.
 *
 * `neon-http` no soporta transacciones: lanza
 * "No transactions support in neon-http driver". Confirmar un acuerdo de
 * pareja por ambos miembros y recalcular una racha son escrituras que
 * tienen que pasar todas o ninguna, así que el driver correcto es este.
 */
if (!globalThis.WebSocket) {
  neonConfig.webSocketConstructor = ws;
}

// En desarrollo Next recarga los módulos en cada cambio; sin esto se abre
// un pool nuevo cada vez hasta agotar las conexiones de Neon.
const globalForDb = globalThis as unknown as {
  __intimatePool?: Pool;
};

const pool =
  globalForDb.__intimatePool ??
  new Pool({ connectionString: env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__intimatePool = pool;
}

export const db = drizzle(pool, {
  schema: { ...schema, ...adminSchema, ...appSchema, ...auditSchema },
});
export type Db = typeof db;
