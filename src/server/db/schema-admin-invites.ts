import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

/**
 * Invitaciones al equipo del panel.
 *
 * Vive en su propio archivo, no en `schema-admin.ts`: ese lo regenera el
 * CLI de Better Auth y borraría cualquier tabla añadida a mano, igual que
 * `schema-audit.ts`.
 *
 * Solo se guarda el hash del código, igual que las invitaciones de pareja:
 * si se filtra la tabla, los enlaces de invitación no sirven para nada.
 */
export const adminInvites = pgTable(
  "admin_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    rol: text("rol").notNull(), // admin | soporte | lectura
    tokenHash: text("token_hash").notNull().unique(),
    invitadoPor: text("invitado_por").notNull(),
    expiraEn: timestamp("expira_en").notNull(),
    usadaEn: timestamp("usada_en"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("admin_invites_email_idx").on(t.email)],
);
