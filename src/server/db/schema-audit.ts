import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

/**
 * Registro de lo que hace el equipo en el panel.
 *
 * Vive en su propio archivo porque `schema-admin.ts` lo regenera el CLI de
 * Better Auth y sobrescribiría cualquier tabla añadida a mano.
 *
 * No hay operación de borrado ni de actualización en ningún caso de uso:
 * la auditoría solo se escribe y se lee. Nunca guarda contenido de usuarios,
 * solo quién hizo qué y sobre qué identificador.
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Correo de quien actúa, o "sistema" para procesos automáticos.
    actor: text("actor").notNull(),
    rol: text("rol").notNull(),
    accion: text("accion").notNull(),
    objetivo: text("objetivo"),
    // IP parcial: suficiente para detectar patrones, no para rastrear.
    ip: text("ip"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("audit_events_fecha_idx").on(t.createdAt),
    index("audit_events_actor_idx").on(t.actor),
  ],
);
