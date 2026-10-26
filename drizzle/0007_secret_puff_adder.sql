CREATE TABLE "bible_chapters" (
	"traduccion" text NOT NULL,
	"libro" integer NOT NULL,
	"capitulo" integer NOT NULL,
	"versiculos" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bible_chapters_traduccion_libro_capitulo_pk" PRIMARY KEY("traduccion","libro","capitulo")
);
