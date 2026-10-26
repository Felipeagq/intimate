import { correoHabilitado, env } from "./env";
import { LOGO_CID, logoBase64 } from "./logo-correo";

export {
  plantillaCodigo,
  plantillaPrueba,
  plantillaVinculacion,
  plantillaInvitacionEquipo,
} from "./plantillas-correo";

/**
 * Envía sin dejar que un fallo del correo rompa la operación que lo
 * disparó. Vincularse a una pareja es lo importante; que el aviso no salga
 * es molesto, pero no puede deshacer el vínculo ni mostrar un error al
 * usuario por algo que no depende de él.
 */
export async function enviarEmailSinBloquear(mensaje: Mensaje) {
  try {
    await enviarEmail(mensaje);
  } catch (e) {
    console.error(
      `No se pudo enviar "${mensaje.asunto}" a ${mensaje.para}:`,
      e instanceof Error ? e.message : e,
    );
  }
}

type Mensaje = {
  para: string;
  asunto: string;
  texto: string;
  html?: string;
  /** Adjunta el logo en línea para que el HTML pueda usar `cid:`. */
  conLogo?: boolean;
};

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";

/**
 * Envío de correo por la API REST de SendGrid.
 *
 * Se usa `fetch` en lugar del SDK a propósito: una dependencia menos, funciona
 * igual en cómputo serverless y cambiar a SES más adelante es reescribir solo
 * esta función, no el resto del código que la llama.
 */
export async function enviarEmail({
  para,
  asunto,
  texto,
  html,
  conLogo = true,
}: Mensaje) {
  // Freno para scripts y pruebas: evita mandar a direcciones inventadas,
  // cuyos rebotes castigan la reputación del remitente en SendGrid.
  const desactivado = process.env.CORREO_DESACTIVADO === "1";

  // En desarrollo también se imprime, para no depender de la bandeja. El
  // pie dice lo que de verdad va a pasar, no lo que debería pasar.
  if (process.env.NODE_ENV !== "production") {
    const estado = desactivado
      ? "SIN ENVIAR: CORREO_DESACTIVADO=1"
      : correoHabilitado
        ? "enviándose por SendGrid…"
        : "SIN ENVIAR: falta configurar SendGrid";

    console.log(
      [
        "",
        `┌─ Correo para ${para}`,
        `│ ${asunto}`,
        "│",
        ...texto.split("\n").map((l) => `│ ${l}`),
        `└─ ${estado}`,
        "",
      ].join("\n"),
    );
  }

  if (desactivado) return;

  if (!correoHabilitado) {
    if (process.env.NODE_ENV !== "production") return;
    throw new Error(
      `No hay proveedor de correo configurado y se intentó enviar a ${para}. ` +
        "Faltan SENDGRID_API_KEY o EMAIL.",
    );
  }

  const logo = conLogo && html ? logoBase64() : null;

  const res = await fetch(SENDGRID_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: para }] }],
      from: { email: env.EMAIL, name: env.EMAIL_NOMBRE },
      subject: asunto,
      // El texto plano va primero: es el orden que exige la API y el que
      // usan los clientes que no muestran HTML.
      content: [
        { type: "text/plain", value: texto },
        ...(html ? [{ type: "text/html", value: html }] : []),
      ],
      ...(logo
        ? {
            attachments: [
              {
                content: logo,
                filename: "intimate.png",
                type: "image/png",
                disposition: "inline",
                content_id: LOGO_CID,
              },
            ],
          }
        : {}),
      // Sin rastreo de apertura ni de clics: este producto no espía a nadie.
      tracking_settings: {
        click_tracking: { enable: false },
        open_tracking: { enable: false },
      },
    }),
  });

  if (!res.ok) {
    // El cuerpo de error de SendGrid no trae datos personales, solo el motivo.
    const detalle = await res.text().catch(() => "");
    throw new Error(
      `SendGrid devolvió ${res.status}. ${detalle.slice(0, 300)}`.trim(),
    );
  }
}
