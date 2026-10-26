import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  date,
  uuid,
  jsonb,
  index,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { user } from "./schema";

/**
 * Tablas del producto.
 *
 * Los identificadores son UUID, nunca secuenciales: un id correlativo deja
 * adivinar cuántas parejas hay y permite recorrer recursos ajenos. Las
 * referencias a `user.id` son texto porque así las genera Better Auth.
 *
 * La regla de acceso de cada tabla se aplica en los casos de uso de
 * `src/server/modules`, no aquí.
 */

// ---------------------------------------------------------------- Pareja

export const couples = pgTable(
  "couples",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    miembroA: text("miembro_a")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    miembroB: text("miembro_b")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    estado: text("estado").notNull().default("activa"), // activa | archivada
    vinculadaEn: timestamp("vinculada_en").defaultNow().notNull(),
    archivadaEn: timestamp("archivada_en"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("couples_miembro_a_idx").on(t.miembroA),
    index("couples_miembro_b_idx").on(t.miembroB),
  ],
);

export const coupleInvites = pgTable(
  "couple_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Solo el hash: si se filtra la tabla, los códigos no sirven.
    codigoHash: text("codigo_hash").notNull().unique(),
    creadorId: text("creador_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiraEn: timestamp("expira_en").notNull(),
    usadaEn: timestamp("usada_en"),
    usadaPor: text("usada_por").references(() => user.id, {
      onDelete: "set null",
    }),
    intentos: integer("intentos").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("couple_invites_creador_idx").on(t.creadorId)],
);

// ------------------------------------------------------------ Devocional

export const devotionals = pgTable(
  "devotionals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    autorId: text("autor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    coupleId: uuid("couple_id").references(() => couples.id, {
      onDelete: "cascade",
    }),
    scope: text("scope").notNull().default("personal"), // personal | pareja
    fechaLocal: date("fecha_local").notNull(),
    pasaje: text("pasaje").notNull(),
    titulo: text("titulo"),
    textoPasaje: text("texto_pasaje"),
    // Secciones SOAP, solo para los personales.
    observacion: text("observacion"),
    aplicacion: text("aplicacion"),
    oracion: text("oracion"),
    completado: boolean("completado").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("devotionals_autor_idx").on(t.autorId),
    index("devotionals_couple_idx").on(t.coupleId),
    // Un devocional de pareja por día. Los personales no entran: tienen
    // couple_id nulo y Postgres cuenta cada nulo como distinto, así que se
    // pueden tener varios el mismo día.
    unique("devotionals_pareja_dia").on(t.coupleId, t.fechaLocal),
  ],
);

export const devotionalResponses = pgTable(
  "devotional_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    devotionalId: uuid("devotional_id")
      .notNull()
      .references(() => devotionals.id, { onDelete: "cascade" }),
    autorId: text("autor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contenido: text("contenido").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  // Una respuesta por persona y devocional.
  (t) => [unique("devotional_responses_unicas").on(t.devotionalId, t.autorId)],
);

// --------------------------------------------------------------- Oración

export const prayerLogs = pgTable(
  "prayer_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Fecha en la zona del usuario: orar a las 23:50 cuenta para ese día
    // aunque el servidor ya esté en el siguiente.
    fechaLocal: date("fecha_local").notNull(),
    minutos: integer("minutos"),
    origen: text("origen").notNull().default("check-in"), // check-in | devocional | temporizador
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("prayer_logs_un_dia").on(t.userId, t.fechaLocal)],
);

export const prayerRequests = pgTable(
  "prayer_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    autorId: text("autor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    coupleId: uuid("couple_id").references(() => couples.id, {
      onDelete: "set null",
    }),
    titulo: text("titulo").notNull(),
    detalle: text("detalle"),
    estado: text("estado").notNull().default("activa"), // activa | respondida | archivada
    compartida: boolean("compartida").notNull().default(false),
    respondidaEn: timestamp("respondida_en"),
    nota: text("nota"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("prayer_requests_autor_idx").on(t.autorId)],
);

// -------------------------------------------------------------- Promesas

export const promises = pgTable(
  "promises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    autorId: text("autor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cita: text("cita").notNull(),
    texto: text("texto").notNull(),
    contexto: text("contexto"),
    etiquetas: text("etiquetas").array().notNull().default([]),
    cumplida: boolean("cumplida").notNull().default(false),
    cumplidaEn: timestamp("cumplida_en"),
    testimonio: text("testimonio"),
    // Para que la promesa del día no se repita hasta recorrer el banco.
    mostradaEn: date("mostrada_en"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("promises_autor_idx").on(t.autorId)],
);

// --------------------------------------------------------------- Acuerdos

export const coupleAgreements = pgTable(
  "couple_agreements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    titulo: text("titulo").notNull(),
    descripcion: text("descripcion"),
    estado: text("estado").notNull().default("en revisión"), // vigente | en revisión | cumplido
    proximaRevision: date("proxima_revision"),
    creadoPor: text("creado_por")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("couple_agreements_couple_idx").on(t.coupleId)],
);

/** Un acuerdo pasa a vigente solo cuando están las dos confirmaciones. */
export const agreementConfirmations = pgTable(
  "agreement_confirmations",
  {
    agreementId: uuid("agreement_id")
      .notNull()
      .references(() => coupleAgreements.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    confirmadoEn: timestamp("confirmado_en").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.agreementId, t.userId] })],
);

// ----------------------------------------------------------- Afirmaciones

export const affirmations = pgTable(
  "affirmations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    deId: text("de_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    paraId: text("para_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mensaje: text("mensaje").notNull(),
    favorita: boolean("favorita").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("affirmations_couple_idx").on(t.coupleId)],
);

// ------------------------------------------------------ Check-in semanal

export const weeklyCheckins = pgTable(
  "weekly_checkins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    // Lunes de la semana, para identificarla sin ambigüedad.
    semanaInicio: date("semana_inicio").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("weekly_checkins_unico").on(t.coupleId, t.semanaInicio)],
);

export const checkinResponses = pgTable(
  "checkin_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    checkinId: uuid("checkin_id")
      .notNull()
      .references(() => weeklyCheckins.id, { onDelete: "cascade" }),
    autorId: text("autor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Una respuesta por pregunta, en el orden del contenido editorial.
    respuestas: text("respuestas").array().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("checkin_responses_unicas").on(t.checkinId, t.autorId)],
);

/** Avance del plan "Conociéndonos a fondo". */
export const couplePlanProgress = pgTable(
  "couple_plan_progress",
  {
    coupleId: uuid("couple_id")
      .primaryKey()
      .references(() => couples.id, { onDelete: "cascade" }),
    semanaActual: integer("semana_actual").notNull().default(1),
    temasCompletados: text("temas_completados").array().notNull().default([]),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

// ------------------------------------------------------------ Texto bíblico

/**
 * Caché de capítulos traídos de la API bíblica.
 *
 * Un capítulo de una traducción no cambia nunca, así que se guarda entero
 * la primera vez y no se vuelve a pedir. Reduce la carga sobre un servicio
 * ajeno y hace que leer un pasaje ya consultado no dependa de que ese
 * servicio esté disponible.
 */
export const bibleChapters = pgTable(
  "bible_chapters",
  {
    traduccion: text("traduccion").notNull(),
    libro: integer("libro").notNull(),
    capitulo: integer("capitulo").notNull(),
    versiculos: jsonb("versiculos")
      .$type<{ verso: number; texto: string }[]>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.traduccion, t.libro, t.capitulo] })],
);

// --------------------------------------------------------------- Relaciones

export const couplesRelations = relations(couples, ({ one, many }) => ({
  a: one(user, { fields: [couples.miembroA], references: [user.id], relationName: "miembroA" }),
  b: one(user, { fields: [couples.miembroB], references: [user.id], relationName: "miembroB" }),
  acuerdos: many(coupleAgreements),
  afirmaciones: many(affirmations),
}));

export const devotionalsRelations = relations(devotionals, ({ many }) => ({
  respuestas: many(devotionalResponses),
}));

export const devotionalResponsesRelations = relations(
  devotionalResponses,
  ({ one }) => ({
    devocional: one(devotionals, {
      fields: [devotionalResponses.devotionalId],
      references: [devotionals.id],
    }),
  }),
);

export const coupleAgreementsRelations = relations(
  coupleAgreements,
  ({ many }) => ({
    confirmaciones: many(agreementConfirmations),
  }),
);

export const agreementConfirmationsRelations = relations(
  agreementConfirmations,
  ({ one }) => ({
    acuerdo: one(coupleAgreements, {
      fields: [agreementConfirmations.agreementId],
      references: [coupleAgreements.id],
    }),
  }),
);
