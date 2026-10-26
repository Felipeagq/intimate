import { db } from "./db/client";
import { emailEvents } from "./db/schema-sistema";
import { correoHabilitado, env } from "./env";
import { LOGO_CID, logoBase64 } from "./logo-correo";

export {
  plantillaCodigo,
  plantillaPrueba,
  plantillaVinculacion,
  plantillaInvitacionEquipo,
  plantillaRespuestaSoporte,
  plantillaAvisoReporteUrgente,
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

export type TipoCorreo =
  | "codigo"
  | "vinculacion"
  | "invitacion_equipo"
  | "soporte"
  | "prueba"
  | "otro";

type Mensaje = {
  para: string;
  asunto: string;
  texto: string;
  html?: string;
  /** Para el registro de envíos del panel. */
  tipo?: TipoCorreo;
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
  tipo = "otro",
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
    const motivo =
      `No hay proveedor de correo configurado y se intentó enviar a ${para}. ` +
      "Faltan SENDGRID_API_KEY o EMAIL.";
    await registrarEnvio(tipo, "fallido", para, motivo);
    throw new Error(motivo);
  }

  const logo = conLogo && html ? logoBase64() : null;

  let res: Response;
  try {
    res = await fetch(SENDGRID_URL, {
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
  } catch (e) {
    // Sin red o sin respuesta: tampoco llegó.
    await registrarEnvio(
      tipo,
      "fallido",
      para,
      e instanceof Error ? e.message : "Error de red",
    );
    throw e;
  }

  if (!res.ok) {
    // El cuerpo de error de SendGrid no trae datos personales, solo el motivo.
    const detalle = await res.text().catch(() => "");
    const motivo = `SendGrid devolvió ${res.status}. ${detalle.slice(0, 300)}`.trim();
    await registrarEnvio(tipo, "fallido", para, motivo);
    throw new Error(motivo);
  }

  await registrarEnvio(tipo, "enviado");
}

/**
 * Deja constancia del resultado. Nunca puede romper el envío: si la base
 * está caída, se pierde el apunte, no el correo.
 *
 * El destinatario solo se guarda en los fallos, que es cuando soporte lo
 * necesita; de los envíos correctos basta con contar.
 */
async function registrarEnvio(
  tipo: TipoCorreo,
  estado: "enviado" | "fallido",
  para?: string,
  error?: string,
) {
  try {
    await db.insert(emailEvents).values({
      tipo,
      estado,
      para: estado === "fallido" ? (para ?? null) : null,
      error: estado === "fallido" ? (error ?? "").slice(0, 400) : null,
    });
  } catch (e) {
    console.error(
      "No se pudo registrar el envío de correo:",
      e instanceof Error ? e.message : e,
    );
  }
}

/**
 * Comprueba que la clave de SendGrid sea válida SIN enviar nada. Consulta
 * los permisos de la clave, que funciona con cualquiera y no genera correo,
 * así que se puede llamar cuantas veces se quiera sin tocar la reputación
 * del remitente.
 */
export async function probarSendGrid(): Promise<{ ok: boolean; detalle: string }> {
  if (!correoHabilitado) {
    return { ok: false, detalle: "Faltan SENDGRID_API_KEY o EMAIL." };
  }
  try {
    const res = await fetch("https://api.sendgrid.com/v3/scopes", {
      headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}` },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (res.ok) return { ok: true, detalle: "La clave es válida." };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, detalle: "SendGrid rechazó la clave (revocada o sin permisos)." };
    }
    return { ok: false, detalle: `SendGrid respondió ${res.status}.` };
  } catch (e) {
    return {
      ok: false,
      detalle: e instanceof Error ? `Sin respuesta: ${e.message}` : "Sin respuesta.",
    };
  }
}
