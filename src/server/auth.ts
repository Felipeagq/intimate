import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db/client";
import { enviarEmail, plantillaCodigo } from "./email";
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
      // false hasta que la zona se detecta del navegador o la elige la
      // persona. Sin esta marca no hay forma de distinguir "nunca la
      // eligió" de "eligió Bogotá", y la detección automática pisaría una
      // decisión explícita.
      zonaConfirmada: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      // Sin verificar. Antes de usarlo para avisos por SMS o WhatsApp hay
      // que confirmarlo con un código: un teléfono que nadie comprobó no
      // sirve como canal de seguridad.
      telefono: {
        type: "string",
        required: false,
      },
      // activa | suspendida | eliminación pendiente.
      // `input: false` impide que llegue desde la petición: el estado de una
      // cuenta solo lo cambia el equipo desde el panel.
      estado: {
        type: "string",
        required: false,
        defaultValue: "activa",
        input: false,
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
        const { texto, html } = plantillaCodigo(otp, 10);

        await enviarEmail({
          para: email,
          asunto:
            type === "sign-in"
              ? `${otp} es tu código para entrar a Intimate`
              : `${otp} confirma tu correo en Intimate`,
          texto,
          html,
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
