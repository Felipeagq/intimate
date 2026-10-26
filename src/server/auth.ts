import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db/client";
import { enviarEmail } from "./email";
import { env, googleHabilitado } from "./env";

export const auth = betterAuth({
  appName: "Intimate",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  database: drizzleAdapter(db, { provider: "pg" }),

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 días
    updateAge: 60 * 60 * 24, // se renueva como mucho una vez al día
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  user: {
    additionalFields: {
      zonaHoraria: {
        type: "string",
        required: false,
        defaultValue: "America/Bogota",
      },
    },
    deleteUser: { enabled: true },
  },

  /**
   * Código de 6 dígitos en lugar de enlace mágico.
   * En una PWA instalada, tocar un enlace desde la app de correo abre el
   * navegador del sistema y no la app, así que la sesión quedaría en el
   * lugar equivocado. Un código se escribe dentro de la app y evita eso.
   */
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      allowedAttempts: 5,
      async sendVerificationOTP({ email, otp, type }) {
        const asunto =
          type === "sign-in"
            ? "Tu código para entrar a Intimate"
            : "Confirma tu correo en Intimate";

        await enviarEmail({
          para: email,
          asunto,
          texto: [
            `Tu código es: ${otp}`,
            "",
            "Caduca en 10 minutos y solo sirve una vez.",
            "Si no fuiste tú, puedes ignorar este mensaje.",
          ].join("\n"),
        });
      },
    }),
    // Debe ir al final: permite que las Server Actions escriban la cookie.
    nextCookies(),
  ],

  // Solo se registra si las dos variables están presentes; así la app
  // arranca sin Google y el botón no aparece hasta que esté configurado.
  socialProviders: googleHabilitado
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},

  advanced: {
    cookiePrefix: "intimate",
  },
});

export type Session = typeof auth.$Infer.Session;
