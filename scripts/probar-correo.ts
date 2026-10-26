/**
 * Envía un correo de prueba, o guarda el HTML para verlo en el navegador.
 *
 *   pnpm email:probar tu@correo.com                        envía el código
 *   pnpm email:probar tu@correo.com --plantilla=vinculacion
 *   pnpm email:probar --vista-previa                       solo escribe HTML
 *
 * La vista previa evita gastar envíos y ensuciar tu bandeja mientras se
 * ajusta el diseño.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import {
  enviarEmail,
  plantillaCodigo,
  plantillaPrueba,
  plantillaVinculacion,
} from "../src/server/email";
import { correoHabilitado, env } from "../src/server/env";

const SALIDA = ".vista-previa-correo";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--vista-previa")) {
    mkdirSync(SALIDA, { recursive: true });

    const codigo = plantillaCodigo("492087", 10);
    const prueba = plantillaPrueba();
    const invito = plantillaVinculacion({
      nombreOtro: "Mateo",
      emailOtro: "mateo@ejemplo.com",
      invitaste: true,
      baseUrl: env.BETTER_AUTH_URL,
    });
    const acepto = plantillaVinculacion({
      nombreOtro: "Sofía",
      emailOtro: "sofia@ejemplo.com",
      invitaste: false,
      baseUrl: env.BETTER_AUTH_URL,
    });

    writeFileSync(`${SALIDA}/codigo.html`, codigo.html);
    writeFileSync(`${SALIDA}/prueba.html`, prueba.html);
    writeFileSync(`${SALIDA}/vinculacion-invito.html`, invito.html);
    writeFileSync(`${SALIDA}/vinculacion-acepto.html`, acepto.html);

    console.log(`\nHTML escrito en ${SALIDA}/`);
    console.log("  codigo.html   el correo con el código de acceso");
    console.log("  prueba.html   el correo de prueba de configuración");
    console.log("  vinculacion-invito.html   quien generó el código");
    console.log("  vinculacion-acepto.html   quien lo usó");
    console.log("\nÁbrelos en el navegador para verlos.\n");
    console.log("Versión en texto plano del código:\n");
    console.log(codigo.texto.split("\n").map((l) => `  ${l}`).join("\n"));
    console.log("");
    return;
  }

  const para = args[0]?.trim();
  if (!para || !para.includes("@")) {
    throw new Error(
      "Uso: pnpm email:probar tu@correo.com   |   pnpm email:probar --vista-previa",
    );
  }
  if (!correoHabilitado) {
    throw new Error("Falta SENDGRID_API_KEY o EMAIL en .env.");
  }

  console.log(`\nRemitente:    ${env.EMAIL_NOMBRE} <${env.EMAIL}>`);
  console.log(`Destinatario: ${para}`);

  const cual = args.find((a) => a.startsWith("--plantilla="))?.split("=")[1];

  const { asunto, texto, html } =
    cual === "vinculacion"
      ? {
          asunto: "Mateo aceptó tu invitación en Intimate",
          ...plantillaVinculacion({
            nombreOtro: "Mateo",
            emailOtro: "mateo@ejemplo.com",
            invitaste: true,
            baseUrl: env.BETTER_AUTH_URL,
          }),
        }
      : {
          asunto: "492087 es tu código para entrar a Intimate",
          ...plantillaCodigo("492087", 10),
        };

  console.log(`Plantilla:    ${cual ?? "codigo"}`);

  await enviarEmail({ para, asunto, texto, html });

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
