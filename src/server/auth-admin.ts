import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db/client";
import * as adminSchema from "./db/schema-admin";
import { env } from "./env";

export const ROLES = ["admin", "soporte", "lectura"] as const;
export type Rol = (typeof ROLES)[number];

/**
 * Instancia separada para el equipo.
 *
 * Es deliberadamente otra instancia, no un campo de rol sobre la cuenta de
 * usuario: tablas propias, cookie propia y ruta propia. Así una sesión de la
 * app nunca sirve en /admin, ni la del panel en la app, que es justo lo que
 * pide el documento. Si se filtra la sesión de un usuario, el panel sigue
 * cerrado.
 */
export const authAdmin = betterAuth({
  appName: "Intimate Panel",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/admin-auth",

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: adminSchema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    // Nadie se registra por su cuenta: las cuentas las crea el script de
    // seed o un admin desde el panel. Sin esto, /api/admin-auth/sign-up/email
    // quedaría abierto a internet.
    disableSignUp: true,
  },

  user: {
    modelName: "adminUser",
    additionalFields: {
      rol: {
        type: "string",
        required: false,
        defaultValue: "lectura",
        // No se acepta desde la petición: el rol no se elige a sí mismo.
        input: false,
      },
    },
  },
  session: {
    modelName: "adminSession",
    // 8 horas, como define el documento para el panel.
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  account: { modelName: "adminAccount" },
  verification: { modelName: "adminVerification" },

  plugins: [
    twoFactor({
      issuer: "Intimate Panel",
      schema: { twoFactor: { modelName: "adminTwoFactor" } },
    }),
    nextCookies(),
  ],

  advanced: {
    cookiePrefix: "intimate_admin",
  },
});

export type AdminSession = typeof authAdmin.$Infer.Session;

// El CLI de Better Auth solo reconoce un export por defecto o uno llamado
// `auth`. Se exporta así para poder regenerar el esquema del panel.
export default authAdmin;
