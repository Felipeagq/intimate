import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea una fecha en español, sin depender de la zona del servidor. */
export function formatDate(
  date: Date | string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es", opts).format(d);
}

/**
 * Formatea una fecha de solo día ("2026-10-25"). `formatDate` la pasaría por
 * `new Date`, que la lee como medianoche UTC y la corre un día al mostrarla
 * en una zona al oeste.
 */
export function formatDateOnly(
  fecha: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
) {
  return new Intl.DateTimeFormat("es", { ...opts, timeZone: "UTC" }).format(
    new Date(`${fecha}T00:00:00Z`),
  );
}
