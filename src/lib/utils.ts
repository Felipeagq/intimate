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
