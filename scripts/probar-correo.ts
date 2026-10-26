/**
 * Envía un correo de prueba real para comprobar la configuración.
 *
 *   pnpm email:probar tu@correo.com
 *
 * Usa la misma plantilla que el código de acceso, así se ve exactamente
 * lo que recibirá la gente.
 */
import { enviarEmail, plantillaCodigo } from "../src/server/email";
import { correoHabilitado, env } from "../src/server/env";

async function main() {
  const para = process.argv[2]?.trim();

  if (!para || !para.includes("@")) {
    throw new Error("Uso: pnpm email:probar tu@correo.com");
  }

  if (!correoHabilitado) {
    throw new Error(
      "Falta SENDGRID_API_KEY o EMAIL en .env. Sin eso no se envía nada.",
    );
  }

  console.log(`\nRemitente:   ${env.EMAIL_NOMBRE} <${env.EMAIL}>`);
  console.log(`Destinatario: ${para}`);

  const { texto, html } = plantillaCodigo("123456", 10);

  await enviarEmail({
    para,
    asunto: "Prueba de configuración de Intimate",
    texto,
    html,
  });

  console.log("\nSendGrid aceptó el mensaje (202).");
  console.log("Si no llega en unos minutos, revisa spam y el panel de SendGrid:");
  console.log("  · Activity Feed, para ver si rebotó");
  console.log("  · Sender Authentication, si el remitente no está verificado\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nError:", err instanceof Error ? err.message : err, "\n");
    process.exit(1);
  });
