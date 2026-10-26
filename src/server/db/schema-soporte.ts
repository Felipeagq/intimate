import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./schema";

/**
 * Mensajes que la gente le escribe al equipo de soporte.
 *
 * Es la ÚNICA excepción a la regla de que el panel no muestra contenido
 * escrito por un usuario, y es estrecha a propósito: son mensajes que la
 * persona decidió enviarle al equipo, y nunca se adjunta nada de lo que
 * escribió dentro de la app (devocionales, promesas, peticiones, notas).
 * La política de privacidad y los textos del panel lo dicen.
 */
export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Se pierde el vínculo, no el mensaje, si la cuenta se elimina.
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    // true solo si lo envió alguien con sesión. Un mensaje desde la página
    // pública puede decir cualquier correo, y el panel lo avisa antes de
    // que alguien responda a una dirección que quizá no es de quien escribió.
    verificado: boolean("verificado").notNull().default(false),
    categoria: text("categoria").notNull(), // ayuda | reporte_abuso | eliminar_cuenta | otro
    prioridad: text("prioridad").notNull().default("normal"), // normal | urgente
    mensaje: text("mensaje").notNull(),
    estado: text("estado").notNull().default("nuevo"), // nuevo | en_curso | resuelto
    asignadoA: text("asignado_a"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    resueltoEn: timestamp("resuelto_en"),
  },
  (t) => [
    index("support_tickets_estado_idx").on(t.estado, t.createdAt),
    index("support_tickets_email_idx").on(t.email, t.createdAt),
  ],
);

export const supportNotes = pgTable(
  "support_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    autor: text("autor").notNull(),
    // nota = interna, solo el equipo · respuesta = se envió por correo
    tipo: text("tipo").notNull(),
    contenido: text("contenido").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("support_notes_ticket_idx").on(t.ticketId, t.createdAt)],
);
