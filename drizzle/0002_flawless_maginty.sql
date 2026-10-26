CREATE TABLE "affirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" uuid NOT NULL,
	"de_id" text NOT NULL,
	"para_id" text NOT NULL,
	"mensaje" text NOT NULL,
	"favorita" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agreement_confirmations" (
	"agreement_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"confirmado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agreement_confirmations_agreement_id_user_id_pk" PRIMARY KEY("agreement_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "checkin_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checkin_id" uuid NOT NULL,
	"autor_id" text NOT NULL,
	"respuestas" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkin_responses_unicas" UNIQUE("checkin_id","autor_id")
);
--> statement-breakpoint
CREATE TABLE "couple_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text,
	"estado" text DEFAULT 'en revisión' NOT NULL,
	"proxima_revision" date,
	"creado_por" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couple_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo_hash" text NOT NULL,
	"creador_id" text NOT NULL,
	"expira_en" timestamp NOT NULL,
	"usada_en" timestamp,
	"usada_por" text,
	"intentos" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "couple_invites_codigo_hash_unique" UNIQUE("codigo_hash")
);
--> statement-breakpoint
CREATE TABLE "couple_plan_progress" (
	"couple_id" uuid PRIMARY KEY NOT NULL,
	"semana_actual" integer DEFAULT 1 NOT NULL,
	"temas_completados" text[] DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"miembro_a" text NOT NULL,
	"miembro_b" text NOT NULL,
	"estado" text DEFAULT 'activa' NOT NULL,
	"vinculada_en" timestamp DEFAULT now() NOT NULL,
	"archivada_en" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devotional_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"devotional_id" uuid NOT NULL,
	"autor_id" text NOT NULL,
	"contenido" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "devotional_responses_unicas" UNIQUE("devotional_id","autor_id")
);
--> statement-breakpoint
CREATE TABLE "devotionals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"autor_id" text NOT NULL,
	"couple_id" uuid,
	"scope" text DEFAULT 'personal' NOT NULL,
	"fecha_local" date NOT NULL,
	"pasaje" text NOT NULL,
	"titulo" text,
	"texto_pasaje" text,
	"observacion" text,
	"aplicacion" text,
	"oracion" text,
	"completado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"fecha_local" date NOT NULL,
	"minutos" integer,
	"origen" text DEFAULT 'check-in' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prayer_logs_un_dia" UNIQUE("user_id","fecha_local")
);
--> statement-breakpoint
CREATE TABLE "prayer_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"autor_id" text NOT NULL,
	"couple_id" uuid,
	"titulo" text NOT NULL,
	"detalle" text,
	"estado" text DEFAULT 'activa' NOT NULL,
	"compartida" boolean DEFAULT false NOT NULL,
	"respondida_en" timestamp,
	"nota" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"autor_id" text NOT NULL,
	"cita" text NOT NULL,
	"texto" text NOT NULL,
	"contexto" text,
	"etiquetas" text[] DEFAULT '{}' NOT NULL,
	"cumplida" boolean DEFAULT false NOT NULL,
	"cumplida_en" timestamp,
	"testimonio" text,
	"mostrada_en" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" uuid NOT NULL,
	"semana_inicio" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_checkins_unico" UNIQUE("couple_id","semana_inicio")
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"rol" text NOT NULL,
	"accion" text NOT NULL,
	"objetivo" text,
	"ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affirmations" ADD CONSTRAINT "affirmations_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affirmations" ADD CONSTRAINT "affirmations_de_id_user_id_fk" FOREIGN KEY ("de_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affirmations" ADD CONSTRAINT "affirmations_para_id_user_id_fk" FOREIGN KEY ("para_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreement_confirmations" ADD CONSTRAINT "agreement_confirmations_agreement_id_couple_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."couple_agreements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreement_confirmations" ADD CONSTRAINT "agreement_confirmations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_responses" ADD CONSTRAINT "checkin_responses_checkin_id_weekly_checkins_id_fk" FOREIGN KEY ("checkin_id") REFERENCES "public"."weekly_checkins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_responses" ADD CONSTRAINT "checkin_responses_autor_id_user_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_agreements" ADD CONSTRAINT "couple_agreements_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_agreements" ADD CONSTRAINT "couple_agreements_creado_por_user_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_invites" ADD CONSTRAINT "couple_invites_creador_id_user_id_fk" FOREIGN KEY ("creador_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_invites" ADD CONSTRAINT "couple_invites_usada_por_user_id_fk" FOREIGN KEY ("usada_por") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_plan_progress" ADD CONSTRAINT "couple_plan_progress_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couples" ADD CONSTRAINT "couples_miembro_a_user_id_fk" FOREIGN KEY ("miembro_a") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couples" ADD CONSTRAINT "couples_miembro_b_user_id_fk" FOREIGN KEY ("miembro_b") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devotional_responses" ADD CONSTRAINT "devotional_responses_devotional_id_devotionals_id_fk" FOREIGN KEY ("devotional_id") REFERENCES "public"."devotionals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devotional_responses" ADD CONSTRAINT "devotional_responses_autor_id_user_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devotionals" ADD CONSTRAINT "devotionals_autor_id_user_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devotionals" ADD CONSTRAINT "devotionals_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_logs" ADD CONSTRAINT "prayer_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_autor_id_user_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promises" ADD CONSTRAINT "promises_autor_id_user_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_checkins" ADD CONSTRAINT "weekly_checkins_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affirmations_couple_idx" ON "affirmations" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "couple_agreements_couple_idx" ON "couple_agreements" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "couple_invites_creador_idx" ON "couple_invites" USING btree ("creador_id");--> statement-breakpoint
CREATE INDEX "couples_miembro_a_idx" ON "couples" USING btree ("miembro_a");--> statement-breakpoint
CREATE INDEX "couples_miembro_b_idx" ON "couples" USING btree ("miembro_b");--> statement-breakpoint
CREATE INDEX "devotionals_autor_idx" ON "devotionals" USING btree ("autor_id");--> statement-breakpoint
CREATE INDEX "devotionals_couple_idx" ON "devotionals" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "prayer_requests_autor_idx" ON "prayer_requests" USING btree ("autor_id");--> statement-breakpoint
CREATE INDEX "promises_autor_idx" ON "promises" USING btree ("autor_id");--> statement-breakpoint
CREATE INDEX "audit_events_fecha_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor");