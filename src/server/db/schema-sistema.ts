import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

/**
 * Registro de envíos de correo.
 *
 * Existe porque un fallo del proveedor es silencioso: `enviarEmailSinBloquear`
 * lo traga a propósito para no deshacer una vinculación por un correo, y sin
 * este registro nadie se enteraría de que los códigos de acceso dejaron de
 * llegar.
 *
 * Minimización de datos: el destinatario solo se guarda cuando el envío
 * falla, que es cuando soporte lo necesita para ayudar. De los envíos
 * correctos solo se cuenta el tipo y la fecha.
 */
export const emailEvents = pgTable(
  "email_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // codigo | vinculacion | invitacion_equipo | soporte | prueba | otro
    tipo: text("tipo").notNull(),
    estado: text("estado").notNull(), // enviado | fallido
    para: text("para"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("email_events_estado_fecha_idx").on(t.estado, t.createdAt)],
);
