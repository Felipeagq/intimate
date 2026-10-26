/**
 * Crea o actualiza una cuenta del equipo para el panel.
 *
 *   pnpm seed:admin tu@correo.com [rol]
 *
 * El registro público está desactivado en la instancia del panel, así que
 * esta es la única forma de crear la primera cuenta. La contraseña se genera
 * aquí y se imprime una sola vez; el segundo factor se configura al entrar.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { authAdmin, ROLES, type Rol } from "../src/server/auth-admin";
import { db } from "../src/server/db/client";
import { adminUser } from "../src/server/db/schema-admin";

function generarContrasena() {
  // 24 caracteres base64url: suficiente entropía y fácil de copiar.
  return randomBytes(18).toString("base64url");
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const rolPedido = (process.argv[3] ?? "admin") as Rol;

  if (!email || !email.includes("@")) {
    throw new Error("Uso: pnpm seed:admin tu@correo.com [admin|soporte|lectura]");
  }
  if (!ROLES.includes(rolPedido)) {
    throw new Error(`Rol inválido: ${rolPedido}. Opciones: ${ROLES.join(", ")}`);
  }

  const ctx = await authAdmin.$context;
  const existente = await db.query.adminUser.findFirst({
    where: eq(adminUser.email, email),
  });

  if (existente) {
    await db
      .update(adminUser)
      .set({ rol: rolPedido, updatedAt: new Date() })
      .where(eq(adminUser.id, existente.id));

    console.log(`\nCuenta ya existía. Rol actualizado a "${rolPedido}".`);
    console.log(`  correo: ${email}`);
    console.log(`  Si olvidaste la contraseña, bórrala de admin_user y vuelve a correr esto.\n`);
    return;
  }

  const contrasena = generarContrasena();
  const hash = await ctx.password.hash(contrasena);

  const usuario = await ctx.internalAdapter.createUser({
    email,
    name: email.split("@")[0],
    emailVerified: true,
    rol: rolPedido,
  });

  await ctx.internalAdapter.createAccount({
    userId: usuario.id,
    providerId: "credential",
    accountId: usuario.id,
    password: hash,
  });

  console.log("\n┌─ Cuenta del panel creada ─────────────────────────────");
  console.log(`│ correo:      ${email}`);
  console.log(`│ rol:         ${rolPedido}`);
  console.log(`│ contraseña:  ${contrasena}`);
  console.log("│");
  console.log("│ Guárdala ahora: no se vuelve a mostrar.");
  console.log("│ Entra en /admin/entrar y configura el segundo factor.");
  console.log("└───────────────────────────────────────────────────────\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nError:", err instanceof Error ? err.message : err, "\n");
    process.exit(1);
  });
