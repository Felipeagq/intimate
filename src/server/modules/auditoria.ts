import { and, desc, gte, ilike, lte } from "drizzle-orm";
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

export type FiltroEventos = {
  limite?: number;
  /** Coincide si el objetivo contiene este texto (p. ej. un correo). */
  objetivoContiene?: string;
  desde?: Date;
  hasta?: Date;
};

export async function listarEventos(filtro: FiltroEventos = {}) {
  const { limite = 100, objetivoContiene, desde, hasta } = filtro;

  const condiciones = [
    objetivoContiene
      ? ilike(auditEvents.objetivo, `%${objetivoContiene}%`)
      : undefined,
    desde ? gte(auditEvents.createdAt, desde) : undefined,
    hasta ? lte(auditEvents.createdAt, hasta) : undefined,
  ].filter((c) => c !== undefined);

  return db
    .select()
    .from(auditEvents)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(auditEvents.createdAt))
    .limit(limite);
}

/** Eventos sobre una cuenta concreta, para su vista de detalle en soporte. */
export async function eventosDeCuenta(email: string, limite = 30) {
  return listarEventos({ objetivoContiene: email, limite });
}
