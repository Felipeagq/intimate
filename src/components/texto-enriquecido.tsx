import { Fragment } from "react";

/**
 * Lectura del texto que escribe el editor enriquecido.
 *
 * El editor guarda Markdown, pero este componente NO es un intérprete de
 * Markdown general: solo entiende el subconjunto que el editor puede producir
 * (títulos, listas, negrita, cursiva y subrayado) y todo lo demás lo pinta
 * como texto. Nunca interpreta HTML, así que lo que alguien escriba —o
 * pegue— no puede inyectar etiquetas ni enlaces en la pantalla de su pareja.
 *
 * El subrayado se guarda como ++texto++, que es como lo serializa el editor.
 */

type Bloque =
  | { tipo: "titulo"; nivel: 2 | 3; texto: string }
  | { tipo: "lista"; ordenada: boolean; items: { texto: string; nivel: number }[] }
  | { tipo: "parrafo"; texto: string };

const TITULO = /^(#{1,3})\s+(.*)$/;
const VINETA = /^(\s*)[-*+]\s+(.*)$/;
const NUMERADA = /^(\s*)\d+[.)]\s+(.*)$/;

function bloques(markdown: string): Bloque[] {
  const lineas = markdown.replace(/\r\n?/g, "\n").split("\n");
  const salida: Bloque[] = [];
  let parrafo: string[] = [];

  const cerrarParrafo = () => {
    if (parrafo.length) salida.push({ tipo: "parrafo", texto: parrafo.join("\n") });
    parrafo = [];
  };

  for (const linea of lineas) {
    if (!linea.trim()) {
      cerrarParrafo();
      continue;
    }

    const t = TITULO.exec(linea);
    if (t) {
      cerrarParrafo();
      // # y ## se muestran como título; ### como subtítulo.
      salida.push({ tipo: "titulo", nivel: t[1].length >= 3 ? 3 : 2, texto: t[2] });
      continue;
    }

    const v = VINETA.exec(linea);
    const n = v ? null : NUMERADA.exec(linea);
    const item = v ?? n;
    if (item) {
      cerrarParrafo();
      const ordenada = Boolean(n);
      const ultimo = salida[salida.length - 1];
      const entrada = { texto: item[2], nivel: Math.floor(item[1].length / 2) };
      if (ultimo?.tipo === "lista" && ultimo.ordenada === ordenada) {
        ultimo.items.push(entrada);
      } else {
        salida.push({ tipo: "lista", ordenada, items: [entrada] });
      }
      continue;
    }

    parrafo.push(linea);
  }
  cerrarParrafo();
  return salida;
}

// Orden importa: ++ y ** antes que * y _.
const INLINE = /(\*\*[^*]+\*\*|\+\+[^+]+\+\+|\*[^*]+\*|_[^_]+_)/;

function enLinea(texto: string): React.ReactNode[] {
  return texto.split(INLINE).map((parte, i) => {
    if (parte.length > 4 && parte.startsWith("**") && parte.endsWith("**")) {
      return <strong key={i}>{enLinea(parte.slice(2, -2))}</strong>;
    }
    if (parte.length > 4 && parte.startsWith("++") && parte.endsWith("++")) {
      return <u key={i}>{enLinea(parte.slice(2, -2))}</u>;
    }
    if (
      parte.length > 2 &&
      ((parte.startsWith("*") && parte.endsWith("*")) ||
        (parte.startsWith("_") && parte.endsWith("_")))
    ) {
      return <em key={i}>{enLinea(parte.slice(1, -1))}</em>;
    }
    return <Fragment key={i}>{parte}</Fragment>;
  });
}

/** Una línea con saltos: el texto antiguo, sin formato, conserva sus saltos. */
function conSaltos(texto: string) {
  return texto
    .split(/\\?\n| {2,}\n/)
    .map((linea, i) => (
      <Fragment key={i}>
        {i > 0 && <br />}
        {enLinea(linea)}
      </Fragment>
    ));
}

export function TextoEnriquecido({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div className={`prosa ${className ?? ""}`}>
      {bloques(markdown).map((b, i) => {
        if (b.tipo === "titulo") {
          const Etiqueta = b.nivel === 2 ? "h2" : "h3";
          return <Etiqueta key={i}>{enLinea(b.texto)}</Etiqueta>;
        }
        if (b.tipo === "lista") {
          const Lista = b.ordenada ? "ol" : "ul";
          return (
            <Lista key={i}>
              {b.items.map((it, j) => (
                <li
                  key={j}
                  style={it.nivel ? { marginLeft: `${it.nivel * 1.25}rem` } : undefined}
                >
                  {enLinea(it.texto)}
                </li>
              ))}
            </Lista>
          );
        }
        return <p key={i}>{conSaltos(b.texto)}</p>;
      })}
    </div>
  );
}
