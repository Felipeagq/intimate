import { correoHabilitado, env } from "./env";

type Mensaje = {
  para: string;
  asunto: string;
  texto: string;
  html?: string;
};

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";

/**
 * Envío de correo por la API REST de SendGrid.
 *
 * Se usa `fetch` en lugar del SDK a propósito: una dependencia menos, funciona
 * igual en cómputo serverless y cambiar a SES más adelante es reescribir solo
 * esta función, no el resto del código que la llama.
 */
export async function enviarEmail({ para, asunto, texto, html }: Mensaje) {
  // En desarrollo también se imprime, para no depender de la bandeja.
  if (process.env.NODE_ENV !== "production") {
    console.log(
      [
        "",
        `┌─ Correo para ${para}`,
        `│ ${asunto}`,
        "│",
        ...texto.split("\n").map((l) => `│ ${l}`),
        `└─ ${correoHabilitado ? "enviándose por SendGrid…" : "SIN ENVIAR: falta configurar SendGrid"}`,
        "",
      ].join("\n"),
    );
  }

  if (!correoHabilitado) {
    if (process.env.NODE_ENV !== "production") return;
    throw new Error(
      `No hay proveedor de correo configurado y se intentó enviar a ${para}. ` +
        "Faltan SENDGRID_API_KEY o EMAIL.",
    );
  }

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
      content: [
        { type: "text/plain", value: texto },
        ...(html ? [{ type: "text/html", value: html }] : []),
      ],
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

/**
 * Plantilla del correo con el código de acceso.
 * HTML en tabla y con estilos en línea: es lo único que renderizan bien los
 * clientes de correo, que no entienden hojas de estilo modernas.
 */
export function plantillaCodigo(otp: string, minutos: number) {
  const texto = [
    `Tu código para entrar a Intimate es: ${otp}`,
    "",
    `Caduca en ${minutos} minutos y solo sirve una vez.`,
    "Si no fuiste tú, puedes ignorar este mensaje.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:32px 16px;background:#f8f4f1;font-family:Helvetica,Arial,sans-serif;color:#433636;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;">
      <tr>
        <td style="padding-bottom:24px;font-size:20px;font-weight:bold;">Intimate</td>
      </tr>
      <tr>
        <td style="background:#ffffff;border-radius:20px;padding:32px;">
          <p style="margin:0 0 8px;font-size:16px;">Tu código para entrar:</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:bold;letter-spacing:8px;">${otp}</p>
          <p style="margin:0;font-size:14px;color:#6b5d5d;line-height:1.6;">
            Caduca en ${minutos} minutos y solo sirve una vez.<br />
            Si no fuiste tú, puedes ignorar este mensaje.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding-top:24px;font-size:12px;color:#6b5d5d;line-height:1.6;">
          Intimate acompaña, no reemplaza la Biblia, la iglesia ni la consejería pastoral.
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { texto, html };
}
