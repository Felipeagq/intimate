import { LOGO_CID } from "./logo-correo";

/**
 * Plantillas de correo.
 *
 * Reglas que manda el medio, no el gusto:
 *  · Maquetación con tablas. Flexbox y grid no funcionan en Outlook.
 *  · Estilos en línea. Gmail descarta buena parte de lo que va en <style>.
 *  · Nada de `backdrop-filter`: el glassmorphism de la app no existe aquí.
 *    Lo que sí se puede es la paleta cálida, las esquinas redondeadas y el
 *    contraste alto, que es de donde viene la mayor parte del carácter.
 *  · El logo viaja adjunto con Content-ID, no como URL: no hay dominio
 *    todavía y la mayoría de clientes bloquean imágenes externas.
 *  · Los correos y teléfonos se envuelven en un enlace propio. Si no,
 *    Gmail y Apple Mail los detectan solos y los pintan de azul, rompiendo
 *    la paleta.
 *
 * Contraste comprobado: chocolate sobre amarillo da 9.8:1 y chocolate
 * sobre crema 10.9:1, muy por encima del 4.5:1 que pide la norma.
 */

const CHOCOLATE = "#433636";
const BEIGE = "#f8f4f1";
const CREMA = "#fdfbf9";
const AMARILLO = "#ffeca9";
const AMARILLO_SUAVE = "#fff7dd";
const DORADO = "#7d6316";
const ATENUADO = "#6b5d5d";
const BORDE = "#efe7e0";

const FUENTE =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

/**
 * Escapa texto para meterlo en HTML.
 *
 * Todo lo que escribió una persona y acaba dentro de un correo pasa por aquí:
 * el nombre de tu pareja, un mensaje de soporte, un correo. Sin esto, alguien
 * podría ponerse como nombre `<a href="…">` y esa etiqueta llegaría tal cual
 * dentro del correo que recibe la otra persona. El texto plano NO se escapa:
 * ahí `&amp;` se vería literal.
 */
export function esc(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Línea de vista previa: lo que se lee en la bandeja antes de abrir. */
function preheader(texto: string) {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${texto}</div>`;
}

/**
 * Un correo escrito tal cual lo detectan Gmail y Apple Mail y lo convierten
 * en un enlace azul subrayado. Envolverlo en un `mailto:` con estilo propio
 * se adelanta a eso y lo deja en los colores de la marca.
 */
function correoEnTexto(email: string) {
  const seguro = esc(email);
  return `<a href="mailto:${seguro}" style="color:${ATENUADO};text-decoration:none;border-bottom:1px solid ${BORDE};">${seguro}</a>`;
}

function envoltorio(contenido: string, vistaPrevia: string) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<meta name="format-detection" content="telephone=no,address=no,email=no">
<title>Intimate</title>
<style>
  /* Apple Mail detecta datos y los repinta; esto le devuelve el color. */
  a[x-apple-data-detectors] {
    color: inherit !important;
    text-decoration: none !important;
    font-size: inherit !important;
    font-family: inherit !important;
    font-weight: inherit !important;
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${BEIGE};">
${preheader(vistaPrevia)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BEIGE};">
  <tr>
    <td align="center" style="padding:32px 16px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;">
${contenido}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Logo adjunto más la palabra, centrados. */
function cabecera() {
  return `
        <tr>
          <td align="center" style="padding:0 0 30px;">
            <img src="cid:${LOGO_CID}" width="56" height="56" alt=""
                 style="display:block;width:56px;height:56px;border:0;outline:none;margin:0 auto 12px;">
            <div style="font-family:${SERIF};font-size:25px;font-weight:bold;letter-spacing:-0.3px;color:${CHOCOLATE};">
              Intimate
            </div>
          </td>
        </tr>`;
}

/** Tarjeta blanca: el contenedor que da la sensación de capas. */
function tarjeta(contenido: string, margenSuperior = 0) {
  return `
        <tr>
          <td style="${margenSuperior ? `padding-top:${margenSuperior}px;` : ""}">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${CREMA};border:1px solid ${BORDE};border-radius:24px;">
              <tr>
                <td style="padding:32px;font-family:${FUENTE};">
${contenido}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
}

function boton(texto: string, url: string) {
  return `
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
                    <tr>
                      <td bgcolor="${AMARILLO}" style="background-color:${AMARILLO};border-radius:999px;">
                        <a href="${url}" style="display:inline-block;padding:15px 30px;font-family:${FUENTE};font-size:15px;font-weight:bold;color:${CHOCOLATE};text-decoration:none;">
                          ${texto}
                        </a>
                      </td>
                    </tr>
                  </table>`;
}

function pie() {
  return `
        <tr>
          <td style="padding:26px 10px 0;font-family:${FUENTE};font-size:12px;line-height:1.7;color:${ATENUADO};">
            Intimate acompaña, no reemplaza la Biblia, la iglesia ni la
            consejería pastoral.
          </td>
        </tr>`;
}

/** Fila de la persona: inicial en círculo, nombre en negrita y correo. */
function filaPersona(nombre: string, email: string) {
  const inicial = esc(nombre.trim().charAt(0).toUpperCase() || "?");
  nombre = esc(nombre);

  return `
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:22px 0 0;">
                    <tr>
                      <td bgcolor="${BEIGE}" style="background-color:${BEIGE};border-radius:18px;padding:16px 18px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="44" bgcolor="${AMARILLO}" align="center"
                                style="background-color:${AMARILLO};border-radius:999px;width:44px;height:44px;font-family:${SERIF};font-size:20px;font-weight:bold;color:${CHOCOLATE};">
                              ${inicial}
                            </td>
                            <td style="padding-left:14px;font-family:${FUENTE};">
                              <div style="font-size:16px;font-weight:bold;color:${CHOCOLATE};line-height:1.3;">
                                ${nombre}
                              </div>
                              <div style="font-size:13px;color:${ATENUADO};line-height:1.5;padding-top:2px;">
                                ${correoEnTexto(email)}
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>`;
}

/** Lista con viñeta amarilla, en filas de tabla para que no se descuadre. */
function lista(items: string[]) {
  const filas = items
    .map(
      (texto, i) => `
                          <tr>
                            <td width="8" valign="top" style="padding:${i === 0 ? "0" : "10px"} 0 0;">
                              <div style="width:6px;height:6px;border-radius:999px;background-color:${AMARILLO};margin-top:7px;"></div>
                            </td>
                            <td valign="top" style="padding:${i === 0 ? "0" : "10px"} 0 0 12px;font-family:${FUENTE};font-size:14px;line-height:1.6;color:${CHOCOLATE};">
                              ${texto}
                            </td>
                          </tr>`,
    )
    .join("");

  return `
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:22px 0 0;">
                    <tr>
                      <td style="border:1px solid ${BORDE};border-radius:18px;padding:20px 22px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
${filas}
                        </table>
                      </td>
                    </tr>
                  </table>`;
}

export function plantillaVinculacion({
  nombreOtro,
  emailOtro,
  invitaste,
  baseUrl,
}: {
  nombreOtro: string;
  emailOtro: string;
  invitaste: boolean;
  baseUrl: string;
}) {
  const titular = invitaste
    ? `${nombreOtro} aceptó tu invitación`
    : `Ya están vinculados con ${nombreOtro}`;

  const texto = [
    titular,
    "",
    invitaste
      ? `Tu código de invitación fue usado por ${nombreOtro} (${emailOtro}).`
      : `Usaste el código de ${nombreOtro} (${emailOtro}).`,
    "",
    "Desde ahora tienen:",
    "· el devocional de los dos, con respuestas que se revelan cuando ambos escriben",
    "· acuerdos que los dos confirman",
    "· palabras de afirmación",
    "· la racha de pareja",
    "",
    `Abrir Intimate: ${baseUrl}/pareja`,
    "",
    invitaste
      ? "¿No reconoces a esta persona? Entra a Ajustes y desvincúlate. Es inmediato y no se le avisa a nadie."
      : "Si algo no cuadra, puedes desvincularte desde Ajustes en cualquier momento.",
  ].join("\n");

  const principal = `
                  <div style="font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:bold;color:${CHOCOLATE};">
                    ${esc(titular)}
                  </div>
                  <p style="margin:10px 0 0;font-size:15px;line-height:1.65;color:${ATENUADO};">
                    ${invitaste ? "Tu código de invitación fue usado por:" : "Usaste el código de:"}
                  </p>
${filaPersona(nombreOtro, emailOtro)}
                  <p style="margin:26px 0 0;font-size:14px;font-weight:bold;color:${CHOCOLATE};">
                    Desde ahora tienen
                  </p>
${lista([
  "El <strong>devocional de los dos</strong>, con respuestas que se revelan cuando ambos escriben",
  "<strong>Acuerdos</strong> que los dos confirman",
  "<strong>Palabras de afirmación</strong>",
  "La <strong>racha de pareja</strong>",
])}
${boton("Abrir Intimate", `${baseUrl}/pareja`)}`;

  // Tarjeta de seguridad aparte, y solo para quien generó el código: es
  // quien no estuvo presente cuando se usó y quien puede deshacerlo.
  const seguridad = invitaste
    ? `
        <tr>
          <td style="padding-top:14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${AMARILLO_SUAVE};border:1px solid ${AMARILLO};border-radius:20px;">
              <tr>
                <td style="padding:20px 24px;font-family:${FUENTE};">
                  <div style="font-size:14px;font-weight:bold;color:${DORADO};">
                    ¿No reconoces a esta persona?
                  </div>
                  <p style="margin:6px 0 0;font-size:14px;line-height:1.65;color:${CHOCOLATE};">
                    Entra a Ajustes y desvincúlate. Es inmediato, no se le
                    avisa a nadie y conservas todo lo que escribiste.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    : `
        <tr>
          <td style="padding:16px 10px 0;font-family:${FUENTE};font-size:13px;line-height:1.7;color:${ATENUADO};">
            Si algo no cuadra, puedes desvincularte desde Ajustes en cualquier
            momento. Es inmediato y no se le avisa a nadie.
          </td>
        </tr>`;

  return {
    texto,
    html: envoltorio(
      `${cabecera()}${tarjeta(principal)}${seguridad}${pie()}`,
      esc(
        invitaste
          ? `${nombreOtro} usó tu código de invitación`
          : `Ya están vinculados con ${nombreOtro}`,
      ),
    ),
  };
}

export function plantillaCodigo(otp: string, minutos: number) {
  const texto = [
    `Tu código para entrar a Intimate es: ${otp}`,
    "",
    `Caduca en ${minutos} minutos y solo sirve una vez.`,
    "No lo compartas con nadie. Si no fuiste tú quien lo pidió,",
    "puedes ignorar este mensaje sin hacer nada.",
  ].join("\n");

  const principal = `
                  <div style="font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:bold;color:${CHOCOLATE};">
                    Tu código para entrar
                  </div>
                  <p style="margin:10px 0 0;font-size:15px;line-height:1.65;color:${ATENUADO};">
                    Escríbelo en la app para continuar.
                  </p>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;">
                    <tr>
                      <td align="center" bgcolor="${AMARILLO}" style="background-color:${AMARILLO};border-radius:20px;padding:28px 16px;">
                        <span style="font-family:${SERIF};font-size:42px;line-height:1;font-weight:bold;letter-spacing:12px;color:${CHOCOLATE};">
                          ${otp}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;">
                    <tr>
                      <td style="border-top:1px solid ${BORDE};padding-top:20px;font-size:14px;line-height:1.7;color:${ATENUADO};">
                        Caduca en <strong style="color:${DORADO};">${minutos} minutos</strong>
                        y solo sirve una vez.
                      </td>
                    </tr>
                  </table>`;

  const seguridad = `
        <tr>
          <td style="padding-top:14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${AMARILLO_SUAVE};border:1px solid ${AMARILLO};border-radius:20px;">
              <tr>
                <td style="padding:20px 24px;font-family:${FUENTE};">
                  <div style="font-size:14px;font-weight:bold;color:${DORADO};">
                    No lo compartas con nadie
                  </div>
                  <p style="margin:6px 0 0;font-size:14px;line-height:1.65;color:${CHOCOLATE};">
                    Ni siquiera con tu pareja. Si no fuiste tú quien lo pidió,
                    ignora este mensaje: sin el código nadie entra a tu cuenta.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;

  return {
    texto,
    html: envoltorio(
      `${cabecera()}${tarjeta(principal)}${seguridad}${pie()}`,
      `${otp} · caduca en ${minutos} minutos`,
    ),
  };
}

export function plantillaPrueba() {
  const texto = [
    "Esto es una prueba de configuración de Intimate.",
    "",
    "Si lo estás leyendo, el envío por SendGrid funciona y el remitente",
    "está verificado correctamente.",
  ].join("\n");

  const principal = `
                  <div style="font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:bold;color:${CHOCOLATE};">
                    La configuración funciona
                  </div>
                  <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${ATENUADO};">
                    Si estás leyendo esto, el envío por SendGrid está bien
                    conectado y el remitente quedó verificado. Si además ves el
                    logo arriba, el adjunto en línea también funciona.
                  </p>`;

  return {
    texto,
    html: envoltorio(
      `${cabecera()}${tarjeta(principal)}${pie()}`,
      "Prueba de configuración de Intimate",
    ),
  };
}

const NOMBRE_ROL: Record<string, string> = {
  admin: "admin",
  soporte: "soporte",
  lectura: "lectura",
};

export function plantillaInvitacionEquipo({
  invitadoPor,
  rol,
  enlace,
  horasVigencia,
}: {
  invitadoPor: string;
  rol: string;
  enlace: string;
  horasVigencia: number;
}) {
  const rolTexto = NOMBRE_ROL[rol] ?? rol;

  const texto = [
    `${invitadoPor} te invitó al panel de Intimate, con el rol de ${rolTexto}.`,
    "",
    `Acepta la invitación y elige tu contraseña: ${enlace}`,
    "",
    `El enlace caduca en ${horasVigencia} horas y solo sirve una vez.`,
    "Si no esperabas esta invitación, puedes ignorar este mensaje.",
  ].join("\n");

  const principal = `
                  <div style="font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:bold;color:${CHOCOLATE};">
                    Te invitaron al panel
                  </div>
                  <p style="margin:10px 0 0;font-size:15px;line-height:1.65;color:${ATENUADO};">
                    <strong style="color:${CHOCOLATE};">${esc(invitadoPor)}</strong> te
                    invitó a entrar con el rol de
                    <strong style="color:${CHOCOLATE};">${esc(rolTexto)}</strong>.
                  </p>
${lista([
  "Elige tu propia contraseña al aceptar: nadie más la conoce, ni quien te invitó",
  "El segundo factor se configura justo después, es obligatorio para todo el equipo",
])}
${boton("Aceptar invitación", enlace)}
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;">
                    <tr>
                      <td style="border-top:1px solid ${BORDE};padding-top:20px;font-size:14px;line-height:1.7;color:${ATENUADO};">
                        El enlace caduca en <strong style="color:${DORADO};">${horasVigencia} horas</strong>
                        y solo sirve una vez.
                      </td>
                    </tr>
                  </table>`;

  const seguridad = `
        <tr>
          <td style="padding-top:14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                   style="background-color:${AMARILLO_SUAVE};border:1px solid ${AMARILLO};border-radius:20px;">
              <tr>
                <td style="padding:20px 24px;font-family:${FUENTE};">
                  <div style="font-size:14px;font-weight:bold;color:${DORADO};">
                    ¿No esperabas esta invitación?
                  </div>
                  <p style="margin:6px 0 0;font-size:14px;line-height:1.65;color:${CHOCOLATE};">
                    Ignora este mensaje. El enlace caduca solo y nadie puede
                    entrar sin él.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;

  return {
    texto,
    html: envoltorio(
      `${cabecera()}${tarjeta(principal)}${seguridad}${pie()}`,
      esc(`${invitadoPor} te invitó al panel de Intimate`),
    ),
  };
}

/** Respuesta del equipo a quien pidió ayuda. */
export function plantillaRespuestaSoporte({
  respuesta,
  enlaceAyuda,
}: {
  respuesta: string;
  enlaceAyuda: string;
}) {
  const texto = [
    "Respuesta del equipo de Intimate",
    "",
    respuesta,
    "",
    `Si necesitas algo más, escríbenos de nuevo aquí: ${enlaceAyuda}`,
  ].join("\n");

  // Los saltos de línea de quien responde se conservan; el resto se escapa.
  const cuerpo = esc(respuesta).replace(/\n/g, "<br>");

  const principal = `
                  <div style="font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:bold;color:${CHOCOLATE};">
                    Respuesta del equipo
                  </div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;">
                    <tr>
                      <td bgcolor="${BEIGE}" style="background-color:${BEIGE};border-radius:18px;padding:20px 22px;font-size:15px;line-height:1.75;color:${CHOCOLATE};">
                        ${cuerpo}
                      </td>
                    </tr>
                  </table>
${boton("Escribirnos de nuevo", enlaceAyuda)}`;

  return {
    texto,
    html: envoltorio(
      `${cabecera()}${tarjeta(principal)}${pie()}`,
      "Respondimos tu mensaje",
    ),
  };
}

/**
 * Aviso interno de un reporte urgente. Deliberadamente NO lleva el mensaje:
 * el correo viaja por un proveedor externo y llega a varias bandejas, y lo
 * que alguien cuenta en un reporte de abuso no debe salir del panel.
 */
export function plantillaAvisoReporteUrgente({ enlace }: { enlace: string }) {
  const texto = [
    "Llegó un reporte urgente a la bandeja de soporte de Intimate.",
    "",
    "Por seguridad el mensaje no va en este correo. Léelo en el panel:",
    enlace,
    "",
    "Los reportes de abuso se atienden primero.",
  ].join("\n");

  const principal = `
                  <div style="font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:bold;color:${CHOCOLATE};">
                    Reporte urgente
                  </div>
                  <p style="margin:10px 0 0;font-size:15px;line-height:1.65;color:${ATENUADO};">
                    Llegó un reporte a la bandeja de soporte. Por seguridad el
                    mensaje no viaja en este correo: ábrelo en el panel.
                  </p>
${boton("Abrir la bandeja", enlace)}`;

  return {
    texto,
    html: envoltorio(
      `${cabecera()}${tarjeta(principal)}${pie()}`,
      "Hay un reporte urgente esperando",
    ),
  };
}
