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
