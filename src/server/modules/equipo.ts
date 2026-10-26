import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { adminUser } from "../db/schema-admin";
import { adminInvites } from "../db/schema-admin-invites";
import { authAdmin, ROLES, type Rol } from "../auth-admin";
import { enviarEmailSinBloquear, plantillaInvitacionEquipo } from "../email";
import { env } from "../env";

const HORAS_VIGENCIA = 72;
const LONGITUD_MINIMA_CONTRASENA = 12;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generarToken() {
  // 32 bytes en base64url: más largo que el código de pareja a propósito,
  // porque esto llega por un enlace y no hace falta que sea corto de
  // escribir a mano.
  return randomBytes(32).toString("base64url");
}

export async function listarInvitacionesPendientes() {
  return db.query.adminInvites.findMany({
    where: isNull(adminInvites.usadaEn),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

/**
 * Crea una invitación y manda el correo.
 *
 * Nadie elige su propia contraseña de entrada: la crea la persona invitada
 * al aceptar, nunca el admin que invita. Así el admin no llega a conocer la
 * contraseña de nadie, a diferencia de generarla y tener que comunicarla
 * por otro medio.
 */
export async function crearInvitacionEquipo(
  invitadoPorId: string,
  invitadoPorEmail: string,
  email: string,
  rol: Rol,
) {
  const correo = email.trim().toLowerCase();

  if (!ROLES.includes(rol)) throw new Error("Rol inválido.");

  const yaExiste = await db.query.adminUser.findFirst({
    where: eq(adminUser.email, correo),
  });
  if (yaExiste) throw new Error("Ya existe una cuenta del equipo con ese correo.");

  const token = generarToken();
  const expiraEn = new Date(Date.now() + HORAS_VIGENCIA * 3600_000);

  await db.transaction(async (tx) => {
    // Una invitación viva por correo: una nueva anula la anterior.
    await tx.delete(adminInvites).where(eq(adminInvites.email, correo));
    await tx.insert(adminInvites).values({
      email: correo,
      rol,
      tokenHash: hashToken(token),
      invitadoPor: invitadoPorId,
      expiraEn,
    });
  });

  await enviarEmailSinBloquear({
    tipo: "invitacion_equipo",
    para: correo,
    asunto: `${invitadoPorEmail} te invitó al panel de Intimate`,
    ...plantillaInvitacionEquipo({
      invitadoPor: invitadoPorEmail,
      rol,
      enlace: `${env.BETTER_AUTH_URL}/admin/invitacion/${token}`,
      horasVigencia: HORAS_VIGENCIA,
    }),
  });

  return { expiraEn };
}

export async function revocarInvitacion(inviteId: string) {
  const fila = await db.query.adminInvites.findFirst({
    where: eq(adminInvites.id, inviteId),
  });
  if (!fila) throw new Error("No encontramos esa invitación.");

  await db.delete(adminInvites).where(eq(adminInvites.id, inviteId));
  return { email: fila.email };
}

/**
 * Verifica un token sin consumirlo, para mostrar la pantalla de aceptación.
 * Mismo error genérico siempre: no revela si el token existió o no.
 */
export async function verificarInvitacion(token: string) {
  const fila = await db.query.adminInvites.findFirst({
    where: eq(adminInvites.tokenHash, hashToken(token)),
  });
  if (!fila || fila.usadaEn || fila.expiraEn < new Date()) return null;
  return { email: fila.email, rol: fila.rol as Rol };
}

/**
 * Crea la cuenta del equipo con la contraseña que la persona invitada eligió.
 * Mismo patrón que scripts/seed-admin.ts: se escribe el hash directamente
 * con el contexto de Better Auth, sin pasar por el registro público, que
 * está desactivado a propósito en la instancia del panel.
 *
 * No va envuelto en `db.transaction`: `ctx.internalAdapter` de Better Auth
 * usa su propia conexión, no la de una transacción abierta con `db`, así
 * que envolverlo no protegería nada y sería engañoso. En su lugar:
 *
 *  1. Se "reclama" la invitación con un UPDATE condicionado a que siga sin
 *     usar — es una sola sentencia, así que sí es atómico, y evita que dos
 *     peticiones a la vez con el mismo enlace creen dos cuentas.
 *  2. Si crear la cuenta falla después de crear el usuario, se borra el
 *     usuario a mano: mejor eso que dejar una cuenta sin forma de entrar.
 */
export async function aceptarInvitacionEquipo(token: string, contrasena: string) {
  const generico = new Error("El enlace no es válido o ya caducó.");

  if (contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    throw new Error(
      `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`,
    );
  }

  const fila = await db.query.adminInvites.findFirst({
    where: eq(adminInvites.tokenHash, hashToken(token)),
  });
  if (!fila || fila.usadaEn || fila.expiraEn < new Date()) throw generico;

  const yaExiste = await db.query.adminUser.findFirst({
    where: eq(adminUser.email, fila.email),
  });
  if (yaExiste) throw new Error("Ya existe una cuenta del equipo con ese correo.");

  const [reclamada] = await db
    .update(adminInvites)
    .set({ usadaEn: new Date() })
    .where(and(eq(adminInvites.id, fila.id), isNull(adminInvites.usadaEn)))
    .returning();
  if (!reclamada) throw generico;

  const ctx = await authAdmin.$context;
  const hash = await ctx.password.hash(contrasena);

  const usuario = await ctx.internalAdapter.createUser(
    {
      email: fila.email,
      name: fila.email.split("@")[0],
      emailVerified: true,
      rol: fila.rol,
    },
    { method: "invitacion-equipo" },
  );

  try {
    await ctx.internalAdapter.createAccount({
      userId: usuario.id,
      providerId: "credential",
      accountId: usuario.id,
      password: hash,
    });
  } catch (e) {
    await db.delete(adminUser).where(eq(adminUser.id, usuario.id));
    throw e;
  }

  return { email: fila.email };
}
