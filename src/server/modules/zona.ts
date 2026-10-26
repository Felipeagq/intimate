/**
 * Zonas horarias.
 *
 * De la zona depende qué día cuenta como "hoy" para cada persona, y de eso
 * depende toda la racha. Por eso se valida contra el motor de fechas del
 * propio runtime en lugar de confiar en lo que mande el navegador.
 */

export const ZONA_POR_DEFECTO = "America/Bogota";

export function esZonaValida(zona: unknown): zona is string {
  if (typeof zona !== "string" || zona.length === 0 || zona.length > 64) {
    return false;
  }
  try {
    // Lanza RangeError si la zona no existe.
    new Intl.DateTimeFormat("en", { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

/** Todas las zonas que conoce el runtime, ordenadas, para el selector. */
export function listarZonas(): string[] {
  const zonas = Intl.supportedValuesOf("timeZone");
  // El runtime no siempre incluye UTC en la lista, y alguien puede querer
  // exactamente eso.
  return zonas.includes("UTC") ? zonas : ["UTC", ...zonas];
}

/** Desfase actual respecto a UTC, por ejemplo "UTC-5". Solo informativo. */
export function desfaseDe(zona: string, momento = new Date()): string {
  const partes = new Intl.DateTimeFormat("en", {
    timeZone: zona,
    timeZoneName: "shortOffset",
  }).formatToParts(momento);

  const nombre = partes.find((p) => p.type === "timeZoneName")?.value ?? "";
  return nombre.replace("GMT", "UTC") || "UTC";
}
