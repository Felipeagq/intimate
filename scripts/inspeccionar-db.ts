/**
 * Muestra cuántas filas hay en cada tabla, sin imprimir contenido sensible.
 *
 *   pnpm db:inspect
 */
import { sql } from "drizzle-orm";
import { db } from "../src/server/db/client";

const TABLAS = [
  "user",
  "session",
  "account",
  "verification",
  "admin_user",
  "admin_session",
  "admin_account",
  "admin_verification",
  "admin_two_factor",
] as const;

async function main() {
  console.log("\nFilas por tabla:\n");

  for (const tabla of TABLAS) {
    const r = await db.execute(
      sql`select count(*)::int as n from ${sql.identifier(tabla)}`,
    );
    const n = (r.rows[0] as { n: number }).n;
    console.log(`  ${tabla.padEnd(20)} ${n}`);
  }

  console.log("\nCuentas de la app (tabla user):");
  const usuarios = await db.execute(
    sql`select email, created_at from "user" order by created_at`,
  );
  if (usuarios.rows.length === 0) console.log("  (ninguna)");
  for (const u of usuarios.rows as { email: string; created_at: Date }[]) {
    console.log(`  ${u.email}`);
  }

  console.log("\nCuentas del equipo (tabla admin_user):");
  const admins = await db.execute(
    sql`select email, rol, two_factor_enabled from admin_user order by created_at`,
  );
  if (admins.rows.length === 0) console.log("  (ninguna)");
  for (const a of admins.rows as {
    email: string;
    rol: string;
    two_factor_enabled: boolean | null;
  }[]) {
    console.log(
      `  ${a.email.padEnd(30)} rol=${a.rol} mfa=${a.two_factor_enabled ? "sí" : "no"}`,
    );
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
