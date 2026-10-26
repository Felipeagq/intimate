CREATE TABLE "support_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"autor" text NOT NULL,
	"tipo" text NOT NULL,
	"contenido" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"verificado" boolean DEFAULT false NOT NULL,
	"categoria" text NOT NULL,
	"prioridad" text DEFAULT 'normal' NOT NULL,
	"mensaje" text NOT NULL,
	"estado" text DEFAULT 'nuevo' NOT NULL,
	"asignado_a" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resuelto_en" timestamp
);
--> statement-breakpoint
ALTER TABLE "support_notes" ADD CONSTRAINT "support_notes_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_notes_ticket_idx" ON "support_notes" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "support_tickets_estado_idx" ON "support_tickets" USING btree ("estado","created_at");--> statement-breakpoint
CREATE INDEX "support_tickets_email_idx" ON "support_tickets" USING btree ("email","created_at");