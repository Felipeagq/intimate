"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Underline,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cuadro de texto con formato, al estilo de Notas: se ve el formato mientras
 * se escribe y lo que se guarda es Markdown, así que la columna sigue siendo
 * texto y no hay que migrar nada.
 *
 * Solo se activa lo que la barra ofrece (negrita, cursiva, subrayado, título,
 * subtítulo y listas); enlaces, código y citas están apagados para que el
 * contenido guardado se mantenga dentro de lo que `TextoEnriquecido` sabe
 * mostrar. El componente es no controlado: parte de `valor` y avisa de los
 * cambios; para cargar otro texto, cambia su `key`.
 */
export function EditorEnriquecido({
  valor,
  onCambio,
  onCaracteres,
  limite,
  placeholder,
  idEtiqueta,
  herramientas: conjunto = "completas",
  className,
}: {
  valor: string;
  onCambio: (markdown: string) => void;
  /** Caracteres de texto visible (sin símbolos de formato). */
  onCaracteres?: (n: number) => void;
  limite: number;
  placeholder?: string;
  /** id de la etiqueta que nombra este cuadro, para lectores de pantalla. */
  idEtiqueta: string;
  /**
   * "basicas" quita títulos y subtítulos: para respuestas cortas, donde una
   * barra de siete botones por cuadro pesa más que el texto.
   */
  herramientas?: "completas" | "basicas";
  className?: string;
}) {
  const editor = useEditor({
    // Next renderiza en el servidor: sin esto el HTML del editor no coincide.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        link: false,
      }),
      // `breaks`: el texto anterior, escrito sin formato, conserva sus saltos
      // de línea al abrirse en el editor.
      Markdown.configure({ markedOptions: { breaks: true } }),
      CharacterCount.configure({ limit: limite }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: valor,
    contentType: "markdown",
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": idEtiqueta,
        class: "prosa",
      },
    },
    onCreate: ({ editor: e }) => {
      onCaracteres?.(e.storage.characterCount.characters());
    },
    onUpdate: ({ editor: e }) => {
      onCambio(e.getMarkdown());
      onCaracteres?.(e.storage.characterCount.characters());
    },
  });

  // La barra se repinta al mover el cursor: así se ve qué formato está activo.
  const activo = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      negrita: e?.isActive("bold") ?? false,
      cursiva: e?.isActive("italic") ?? false,
      subrayado: e?.isActive("underline") ?? false,
      titulo: e?.isActive("heading", { level: 2 }) ?? false,
      subtitulo: e?.isActive("heading", { level: 3 }) ?? false,
      vinetas: e?.isActive("bulletList") ?? false,
      numerada: e?.isActive("orderedList") ?? false,
    }),
  });

  const todas: {
    clave: keyof NonNullable<typeof activo>;
    etiqueta: string;
    icono: LucideIcon;
    accion: () => void;
  }[] = editor
    ? [
        {
          clave: "negrita",
          etiqueta: "Negrita",
          icono: Bold,
          accion: () => editor.chain().focus().toggleBold().run(),
        },
        {
          clave: "cursiva",
          etiqueta: "Cursiva",
          icono: Italic,
          accion: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          clave: "subrayado",
          etiqueta: "Subrayado",
          icono: Underline,
          accion: () => editor.chain().focus().toggleUnderline().run(),
        },
        {
          clave: "titulo",
          etiqueta: "Título",
          icono: Heading2,
          accion: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          clave: "subtitulo",
          etiqueta: "Subtítulo",
          icono: Heading3,
          accion: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        },
        {
          clave: "vinetas",
          etiqueta: "Lista con viñetas",
          icono: List,
          accion: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          clave: "numerada",
          etiqueta: "Lista numerada",
          icono: ListOrdered,
          accion: () => editor.chain().focus().toggleOrderedList().run(),
        },
      ]
    : [];

  const herramientas = todas.filter(
    (h) =>
      conjunto === "completas" || (h.clave !== "titulo" && h.clave !== "subtitulo"),
  );

  return (
    <div className={cn("editor-enriquecido", className)}>
      <div
        role="toolbar"
        aria-label="Formato del texto"
        className="mb-2 flex flex-wrap gap-1"
      >
        {herramientas.map((h) => {
          const encendido = activo?.[h.clave] ?? false;
          return (
            <button
              key={h.clave}
              type="button"
              aria-label={h.etiqueta}
              title={h.etiqueta}
              aria-pressed={encendido}
              // El clic no debe quitarle el foco al texto: sin esto la
              // selección se pierde antes de aplicar el formato.
              onMouseDown={(e) => e.preventDefault()}
              onClick={h.accion}
              className={cn(
                "flex size-11 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200",
                encendido
                  ? "bg-honey-300 text-ink-700"
                  : "text-muted hover:text-foreground hover:bg-ink-700/8 dark:hover:bg-white/10",
              )}
            >
              <h.icono className="size-5" aria-hidden />
            </button>
          );
        })}
      </div>

      <EditorContent
        editor={editor}
        className={cn(
          "rounded-2xl px-4 py-3",
          "bg-white/55 dark:bg-white/6",
          "border border-[var(--glass-border)]",
          "transition-colors duration-200 ease-out",
          "focus-within:border-accent focus-within:bg-white/80 dark:focus-within:bg-white/10",
        )}
      />
    </div>
  );
}
