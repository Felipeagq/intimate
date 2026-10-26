import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * El logo para los correos, adjunto en línea.
 *
 * Una imagen en un correo necesita una URL pública, y todavía no hay
 * dominio. La alternativa es adjuntarla con un Content-ID y referenciarla
 * como `cid:logo`: así viaja dentro del mensaje y la muestran Gmail,
 * Outlook y Apple Mail sin depender de un servidor.
 *
 * Se lee una sola vez y se guarda en memoria. Si el archivo no está, se
 * devuelve null y el correo sale sin logo: un problema de imagen nunca
 * puede impedir que llegue un código de acceso.
 */
export const LOGO_CID = "logo-intimate";

let cache: string | null | undefined;

export function logoBase64(): string | null {
  if (cache !== undefined) return cache;

  try {
    const ruta = join(process.cwd(), "public", "icons", "icon-128.png");
    cache = readFileSync(ruta).toString("base64");
  } catch {
    console.warn("No se pudo leer el logo para los correos; se envía sin él.");
    cache = null;
  }

  return cache;
}
