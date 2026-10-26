import { z } from "zod";

/**
 * Configuración solo por variables de entorno, validadas al arrancar.
 * Si falta algo, el proceso falla aquí y no a mitad de una petición.
 * Ningún SDK ni API exclusivo de un proveedor: esto es lo que permite
 * mover el backend a otro lugar cambiando infraestructura, no código.
 */
const schema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "Falta DATABASE_URL (cadena de conexión de Neon)"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET debe tener al menos 32 caracteres"),
  BETTER_AUTH_URL: z.string().url(),

  // Google es opcional: la app funciona sin él y el botón solo
  // aparece cuando las dos variables están presentes.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Correo. Sin esto la app arranca igual, pero en desarrollo los mensajes
  // solo se imprimen en consola y en producción el envío falla explícito.
  SENDGRID_API_KEY: z.string().startsWith("SG.").optional(),
  EMAIL: z.string().email("EMAIL debe ser el correo remitente").optional(),
  EMAIL_NOMBRE: z.string().default("Intimate"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const detalle = parsed.error.issues
    .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Variables de entorno inválidas:\n${detalle}`);
}

export const env = parsed.data;

export const googleHabilitado = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

export const correoHabilitado = Boolean(env.SENDGRID_API_KEY && env.EMAIL);
