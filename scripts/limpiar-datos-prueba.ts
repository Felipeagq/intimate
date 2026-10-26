/**
 * Borra los datos de prueba y deja la base lista para empezar de cero.
 *
 *   pnpm db:limpiar
 *
 * Qué borra:
 *   · todas las cuentas de usuario de la app, con sus sesiones y códigos
 *   · todas las sesiones del panel (el equipo tendrá que volver a entrar)
 *
 * Qué conserva:
 *   · admin_user y admin_account, es decir el acceso del equipo al panel
 *
 * Todo ocurre en una transacción: o se borra entero o no se borra nada.
 */
import { sql } from "drizzle-orm";
import { db } from "../src/server/db/client";

async function contar(tabla: string) {
  const r = await db.execute(
    sql`select count(*)::int as n from ${sql.identifier(tabla)}`,
  );
  return (r.rows[0] as { n: number }).n;
}

async function main() {
  const antes = {
    user: await contar("user"),
    session: await contar("session"),
    account: await contar("account"),
    verification: await contar("verification"),
    adminSession: await contar("admin_session"),
    adminVerification: await contar("admin_verification"),
  };

  console.log("\nAntes de limpiar:");
  for (const [k, v] of Object.entries(antes)) console.log(`  ${k.padEnd(20)} ${v}`);

  await db.transaction(async (tx) => {
    // El orden importa aunque haya borrado en cascada: así no dependemos
    // de que las claves foráneas estén bien definidas.
    await tx.execute(sql`delete from "session"`);
    await tx.execute(sql`delete from "account"`);
    await tx.execute(sql`delete from "verification"`);
    await tx.execute(sql`delete from "user"`);

    await tx.execute(sql`delete from admin_session`);
    await tx.execute(sql`delete from admin_verification`);
  });

  const despues = {
    user: await contar("user"),
    session: await contar("session"),
    account: await contar("account"),
    verification: await contar("verification"),
    adminSession: await contar("admin_session"),
    adminVerification: await contar("admin_verification"),
  };

  console.log("\nDespués de limpiar:");
  for (const [k, v] of Object.entries(despues)) console.log(`  ${k.padEnd(20)} ${v}`);

  console.log("\nConservado:");
  console.log(`  admin_user           ${await contar("admin_user")}`);
  console.log(`  admin_account        ${await contar("admin_account")}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
