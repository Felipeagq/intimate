/**
 * Crea, actualiza o elimina una cuenta del equipo para el panel.
 *
 *   pnpm seed:admin <correo> [rol] [opciones]
 *
 * Opciones:
 *   --password=<valor>   fija una contraseña concreta
 *   --rotate-password    genera una contraseña nueva al azar
 *   --reset-mfa          borra el segundo factor (si alguien pierde el móvil)
 *   --eliminar           borra la cuenta del equipo
 *
 * El registro público está desactivado en la instancia del panel, así que
 * esta es la única forma de crear la primera cuenta.
 *
 * Ojo: este script escribe el hash directamente, así que NO pasa por la
 * validación de longitud mínima de Better Auth. Es deliberado, para poder
 * sembrar cuentas de desarrollo, pero una contraseña corta sembrada aquí no
 * se podría volver a fijar desde el panel.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { authAdmin, ROLES, type Rol } from "../src/server/auth-admin";
import { db } from "../src/server/db/client";
import {
  adminUser,
  adminTwoFactor,
  adminAccount,
  adminSession,
} from "../src/server/db/schema-admin";

const LONGITUD_MINIMA = 12;

function generarContrasena() {
  // 24 caracteres base64url: suficiente entropía y fácil de copiar.
  return randomBytes(18).toString("base64url");
}

function leerOpcion(args: string[], nombre: string) {
  const conIgual = args.find((a) => a.startsWith(`--${nombre}=`));
  if (conIgual) return conIgual.slice(nombre.length + 3);

  const i = args.indexOf(`--${nombre}`);
  if (i !== -1 && args[i + 1] && !args[i + 1].startsWith("--")) {
    return args[i + 1];
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);

  const resetMfa = args.includes("--reset-mfa");
  const rotar = args.includes("--rotate-password");
  const eliminar = args.includes("--eliminar");
  const contrasenaExplicita = leerOpcion(args, "password");

  // Quita banderas y el valor suelto que pueda acompañar a --password.
  const posicionales = args.filter(
    (a, i) =>
      !a.startsWith("--") &&
      !(i > 0 && args[i - 1] === "--password") &&
      a !== contrasenaExplicita,
  );

  const email = posicionales[0]?.trim().toLowerCase();
  const rolPedido = (posicionales[1] ?? "admin") as Rol;

  if (!email || !email.includes("@")) {
    throw new Error("Uso: pnpm seed:admin <correo> [rol] [opciones]");
  }
  if (!ROLES.includes(rolPedido)) {
    throw new Error(`Rol inválido: ${rolPedido}. Opciones: ${ROLES.join(", ")}`);
  }

  const ctx = await authAdmin.$context;
  const existente = await db.query.adminUser.findFirst({
    where: eq(adminUser.email, email),
  });

  // --- Eliminar ---
  if (eliminar) {
    if (!existente) {
      console.log(`\nNo existe ninguna cuenta del equipo con ${email}.\n`);
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(adminTwoFactor)
        .where(eq(adminTwoFactor.userId, existente.id));
      await tx.delete(adminSession).where(eq(adminSession.userId, existente.id));
      await tx.delete(adminAccount).where(eq(adminAccount.userId, existente.id));
      await tx.delete(adminUser).where(eq(adminUser.id, existente.id));
    });

    console.log(`\nCuenta del equipo eliminada: ${email}\n`);
    return;
  }

  const contrasena =
    contrasenaExplicita ?? (rotar || !existente ? generarContrasena() : null);

  if (contrasena && contrasena.length < LONGITUD_MINIMA) {
    console.warn(
      `\nAviso: la contraseña tiene ${contrasena.length} caracteres y la ` +
        `política del panel exige ${LONGITUD_MINIMA}. Se siembra igual, pero ` +
        `no podría volver a fijarse desde el panel. Rótala antes de desplegar.`,
    );
  }

  const hash = contrasena ? await ctx.password.hash(contrasena) : null;

  // --- Actualizar ---
  if (existente) {
    await db.transaction(async (tx) => {
      await tx
        .update(adminUser)
        .set({
          rol: rolPedido,
          ...(resetMfa ? { twoFactorEnabled: false } : {}),
          updatedAt: new Date(),
        })
        .where(eq(adminUser.id, existente.id));

      if (resetMfa) {
        await tx
          .delete(adminTwoFactor)
          .where(eq(adminTwoFactor.userId, existente.id));
      }

      if (hash) {
        await tx
          .update(adminAccount)
          .set({ password: hash, updatedAt: new Date() })
          .where(eq(adminAccount.userId, existente.id));
        // Cambiar la contraseña cierra las sesiones abiertas.
        await tx
          .delete(adminSession)
          .where(eq(adminSession.userId, existente.id));
      }
    });

    console.log(`\nCuenta actualizada: ${email} (rol ${rolPedido})`);
    if (resetMfa) console.log("  segundo factor: BORRADO");
    if (contrasena) console.log(`  contraseña nueva: ${contrasena}`);
    console.log("");
    return;
  }

  // --- Crear ---
  const usuario = await ctx.internalAdapter.createUser(
    {
      email,
      name: email.split("@")[0],
      emailVerified: true,
      rol: rolPedido,
    },
    // El segundo argumento describe el origen de la creación.
    { method: "seed-script" },
  );

  await ctx.internalAdapter.createAccount({
    userId: usuario.id,
    providerId: "credential",
    accountId: usuario.id,
    password: hash!,
  });

  console.log("\n┌─ Cuenta del panel creada ─────────────────────────────");
  console.log(`│ correo:      ${email}`);
  console.log(`│ rol:         ${rolPedido}`);
  console.log(`│ contraseña:  ${contrasena}`);
  console.log("│");
  console.log("│ Entra en /admin/entrar y configura el segundo factor.");
  console.log("└───────────────────────────────────────────────────────\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nError:", err instanceof Error ? err.message : err, "\n");
    process.exit(1);
  });
