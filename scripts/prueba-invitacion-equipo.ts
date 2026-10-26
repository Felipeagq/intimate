/**
 * Prueba de integración del flujo de invitación al equipo, contra la base
 * real. No depende del admin de desarrollo para nada destructivo: solo lo
 * usa para firmar como "quien invita".
 *
 *   pnpm test:invitacion
 *
 * Igual que prueba-integracion.ts, limpia lo que crea al terminar.
 */
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../src/server/db/client";
import { adminUser } from "../src/server/db/schema-admin";
import { adminInvites } from "../src/server/db/schema-admin-invites";
import * as equipo from "../src/server/modules/equipo";

const CORREO_INVITADO = "invitado.integracion@feanware-test.local";
const CORREO_ACEPTA = "acepta.integracion@feanware-test.local";

let fallos = 0;

function comprobar(descripcion: string, condicion: boolean) {
  console.log(`  ${condicion ? "OK   " : "FALLA"} ${descripcion}`);
  if (!condicion) fallos++;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function limpiar() {
  await db
    .delete(adminInvites)
    .where(eq(adminInvites.email, CORREO_INVITADO));
  await db.delete(adminInvites).where(eq(adminInvites.email, CORREO_ACEPTA));

  for (const correo of [CORREO_INVITADO, CORREO_ACEPTA]) {
    const fila = await db.query.adminUser.findFirst({
      where: eq(adminUser.email, correo),
    });
    // Borrar adminUser arrastra por cascada admin_account, admin_session y
    // admin_two_factor: todas referencian su id con onDelete: "cascade".
    if (fila) await db.delete(adminUser).where(eq(adminUser.id, fila.id));
  }
}

async function main() {
  await limpiar();

  const quienInvita = await db.query.adminUser.findFirst({
    where: eq(adminUser.email, "info@feanware.com"),
  });
  if (!quienInvita) {
    throw new Error(
      "Falta la cuenta info@feanware.com. Corre antes: pnpm seed:admin info@feanware.com admin",
    );
  }

  console.log("\n— Crear invitación (módulo real, con envío de correo) —");
  await equipo.crearInvitacionEquipo(
    quienInvita.id,
    quienInvita.email,
    CORREO_INVITADO,
    "soporte",
  );

  const pendientes = await equipo.listarInvitacionesPendientes();
  comprobar(
    "aparece en la lista de pendientes",
    pendientes.some((p) => p.email === CORREO_INVITADO && p.rol === "soporte"),
  );

  let duplicada = false;
  try {
    await equipo.crearInvitacionEquipo(
      quienInvita.id,
      quienInvita.email,
      quienInvita.email,
      "lectura",
    );
  } catch {
    duplicada = true;
  }
  comprobar("no se puede invitar un correo que ya es del equipo", duplicada);

  const invitePendiente = await db.query.adminInvites.findFirst({
    where: eq(adminInvites.email, CORREO_INVITADO),
  });
  await equipo.revocarInvitacion(invitePendiente!.id);
  const trasRevocar = await equipo.listarInvitacionesPendientes();
  comprobar(
    "revocar la quita de pendientes",
    !trasRevocar.some((p) => p.email === CORREO_INVITADO),
  );

  console.log("\n— Aceptar con un token controlado —");
  const token = randomBytes(32).toString("base64url");
  const [invite] = await db
    .insert(adminInvites)
    .values({
      email: CORREO_ACEPTA,
      rol: "lectura",
      tokenHash: hashToken(token),
      invitadoPor: quienInvita.id,
      expiraEn: new Date(Date.now() + 3600_000),
    })
    .returning();

  const verificada = await equipo.verificarInvitacion(token);
  comprobar(
    "el token válido se verifica y trae el rol correcto",
    verificada?.email === CORREO_ACEPTA && verificada.rol === "lectura",
  );

  let rechazadaPorCorta = false;
  try {
    await equipo.aceptarInvitacionEquipo(token, "corta");
  } catch {
    rechazadaPorCorta = true;
  }
  comprobar(
    "una contraseña de menos de 12 caracteres se rechaza",
    rechazadaPorCorta,
  );
  comprobar(
    "el token sigue vivo después del rechazo (no se consumió)",
    (await equipo.verificarInvitacion(token)) !== null,
  );

  const aceptada = await equipo.aceptarInvitacionEquipo(
    token,
    "una-contrasena-larga-123",
  );
  comprobar("crea la cuenta con el correo de la invitación", aceptada.email === CORREO_ACEPTA);

  const nuevoUsuario = await db.query.adminUser.findFirst({
    where: eq(adminUser.email, CORREO_ACEPTA),
  });
  comprobar(
    "la cuenta nueva tiene el rol que decía la invitación",
    nuevoUsuario?.rol === "lectura",
  );

  let tokenReusado = false;
  try {
    await equipo.aceptarInvitacionEquipo(token, "otra-contrasena-456");
  } catch {
    tokenReusado = true;
  }
  comprobar("el mismo token no se puede usar dos veces", tokenReusado);

  let tokenInventado = false;
  try {
    await equipo.aceptarInvitacionEquipo("token-que-no-existe", "contrasena-larga-123");
  } catch {
    tokenInventado = true;
  }
  comprobar("un token inventado se rechaza", tokenInventado);

  console.log(`\n(invitación usada: ${invite.id})`);
}

main()
  .then(async () => {
    await limpiar();
    console.log(
      fallos === 0
        ? "\nTodas las comprobaciones pasaron.\n"
        : `\n${fallos} comprobaciones fallaron.\n`,
    );
    process.exit(fallos === 0 ? 0 : 1);
  })
  .catch(async (err) => {
    await limpiar().catch(() => {});
    console.error("\nError:", err instanceof Error ? err.message : err, "\n");
    process.exit(1);
  });
