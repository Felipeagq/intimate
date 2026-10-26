import { desc } from "drizzle-orm";
import { db } from "../db/client";
import { auditEvents } from "../db/schema-audit";

export type Evento = {
  actor: string;
  rol: string;
  accion: string;
  objetivo?: string | null;
  ip?: string | null;
};

/**
 * Recorta la IP a sus dos primeros grupos: basta para detectar patrones
 * anómalos sin guardar una dirección completa de nadie.
 */
function recortarIp(ip?: string | null) {
  if (!ip) return null;
  if (ip.includes(":")) return `${ip.split(":").slice(0, 2).join(":")}:x:x`;
  const partes = ip.split(".");
  return partes.length === 4 ? `${partes[0]}.${partes[1]}.x.x` : null;
}

/**
 * Escribe un evento de auditoría.
 *
 * No existe ninguna función para borrar ni actualizar eventos, y es
 * intencional: la auditoría solo crece. Nunca guarda contenido escrito por
 * un usuario, solo quién hizo qué y sobre qué identificador.
 */
export async function registrarEvento(evento: Evento) {
  await db.insert(auditEvents).values({
    actor: evento.actor,
    rol: evento.rol,
    accion: evento.accion,
    objetivo: evento.objetivo ?? null,
    ip: recortarIp(evento.ip),
  });
}

export async function listarEventos(limite = 100) {
  return db
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.createdAt))
    .limit(limite);
}
