import { env } from "./env";

/**
 * Envío de correo. El proveedor (SendGrid o SES) todavía no está decidido,
 * así que en desarrollo el mensaje se imprime en la consola del servidor y
 * en producción falla de forma explícita en vez de perder el correo en
 * silencio, que dejaría a la gente sin poder entrar y sin saber por qué.
 */
type Mensaje = {
  para: string;
  asunto: string;
  texto: string;
};

export async function enviarEmail({ para, asunto, texto }: Mensaje) {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      [
        "",
        "┌─ Correo (modo desarrollo, no se envió nada) ──────────────",
        `│ Para:    ${para}`,
        `│ Asunto:  ${asunto}`,
        "│",
        ...texto.split("\n").map((l) => `│ ${l}`),
        "└───────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return;
  }

  throw new Error(
    `No hay proveedor de correo configurado y se intentó enviar a ${para}. ` +
      `Falta integrar SendGrid o SES antes de desplegar (${env.BETTER_AUTH_URL}).`,
  );
}
