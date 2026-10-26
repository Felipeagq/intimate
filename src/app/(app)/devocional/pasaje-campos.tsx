"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Eye, HandHeart, Loader2, Pencil, Search, Sprout } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { buscarPasaje } from "@/actions/biblia";

/** Bloque numerado de un formulario: el número da el orden de un vistazo. */
export function Seccion({
  numero,
  titulo,
  ayuda,
  children,
}: {
  numero: number;
  titulo: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span
          className="bg-honey-300 text-ink-700 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
          aria-hidden
        >
          {numero}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg leading-8">{titulo}</h2>
          {ayuda && (
            <p className="text-muted text-sm leading-relaxed">{ayuda}</p>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}

/**
 * Secciones 1 y 2 de los formularios de devocional: el pasaje y su texto.
 *
 * El texto se trae solo al salir del campo del pasaje, siempre que todavía no
 * haya texto: si la persona ya escribió o editó algo, no se le pisa. Los
 * campos llevan `name` para que el formulario los lea con FormData.
 */
export function SeccionesPasaje({
  placeholder,
  numeroInicial = 1,
}: {
  placeholder: string;
  numeroInicial?: number;
}) {
  const [pasaje, setPasaje] = useState("");
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traduccion, setTraduccion] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  // Última cita consultada: evita repetir la misma petición al volver al campo.
  const consultada = useRef("");

  // `forzar` es el botón: lo pidió la persona, así que se vuelve a consultar
  // aunque la cita sea la misma y se reemplaza el texto que hubiera.
  const traer = (referencia: string, forzar = false) => {
    const limpia = referencia.trim();
    if (!limpia || (!forzar && limpia === consultada.current)) return;
    consultada.current = limpia;

    iniciar(async () => {
      setError(null);
      const r = await buscarPasaje(limpia, "devocional");
      if (r.ok) {
        setPasaje(r.referencia);
        setTexto(r.texto);
        setTraduccion(r.traduccion);
      } else {
        // Se permite reintentar con la misma cita.
        consultada.current = "";
        setError(r.error);
      }
    });
  };

  return (
    <Seccion
      numero={numeroInicial}
      titulo="Pasaje"
      ayuda="¿Qué vas a leer hoy? Escribe la cita y busca el texto."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="pasaje"
          name="pasaje"
          aria-label="Cita del pasaje"
          required
          maxLength={120}
          value={pasaje}
          onChange={(e) => setPasaje(e.target.value)}
          onBlur={(e) => {
            // Solo se trae solo si aún no hay texto que proteger.
            if (!texto.trim()) traer(e.target.value);
          }}
          onKeyDown={(e) => {
            // Enter busca el texto en lugar de enviar el formulario entero.
            if (e.key === "Enter") {
              e.preventDefault();
              traer(pasaje, true);
            }
          }}
          placeholder={placeholder}
          className="sm:flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          loading={pendiente}
          disabled={!pasaje.trim()}
          onClick={() => traer(pasaje, true)}
        >
          <Search className="size-4" aria-hidden />
          Buscar texto
        </Button>
      </div>
      <input type="hidden" name="texto" value={texto} />

      <div aria-live="polite" className="mt-2 min-h-5 text-xs">
        {pendiente ? (
          <p className="text-muted flex items-center gap-1.5">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Buscando el texto…
          </p>
        ) : traduccion && texto && !editando ? (
          <p className="text-muted flex items-center gap-1.5">
            <Check
              className="size-3.5 text-emerald-700 dark:text-emerald-400"
              aria-hidden
            />
            {traduccion} · dominio público
          </p>
        ) : null}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {editando ? (
        <Textarea
          aria-label="Texto del pasaje"
          className="mt-3 min-h-28"
          maxLength={4000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe aquí el texto del pasaje"
        />
      ) : (
        texto && (
          <blockquote className="border-honey-500 mt-3 border-l-2 pl-4">
            <p className="font-display text-lg leading-relaxed">{texto}</p>
          </blockquote>
        )
      )}

      <button
        type="button"
        onClick={() => setEditando((e) => !e)}
        className="text-accent mt-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium underline"
      >
        <Pencil className="size-3.5" aria-hidden />
        {editando ? "Listo" : texto ? "Editar el texto" : "Escribir el texto a mano"}
      </button>
    </Seccion>
  );
}

const SOAP = [
  { icono: Eye, titulo: "Observación", ayuda: "Qué dice el texto" },
  { icono: Sprout, titulo: "Aplicación", ayuda: "Qué cambia en tu semana" },
  { icono: HandHeart, titulo: "Oración", ayuda: "Se lo dices a Dios" },
] as const;

/** Sección "Qué sigue" del devocional personal: explica SOAP en una línea. */
export function SeccionQueSigueSoap({ numero }: { numero: number }) {
  return (
    <Seccion
      numero={numero}
      titulo="Qué sigue"
      ayuda="Método SOAP: observas el texto, lo aplicas a tu semana y lo conviertes en oración."
    >
      <ol className="grid grid-cols-3 gap-2" aria-label="Secciones del devocional">
        {SOAP.map((p) => (
          <li
            key={p.titulo}
            className="bg-ink-700/6 rounded-2xl p-3 text-center dark:bg-white/8"
          >
            <p.icono className="mx-auto size-5" aria-hidden />
            <span className="mt-1.5 block text-xs font-medium">{p.titulo}</span>
            <span className="text-muted mt-0.5 hidden text-xs sm:block">
              {p.ayuda}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-muted mt-3 text-xs">
        Unos 10 minutos. El borrador se guarda al avanzar.
      </p>
    </Seccion>
  );
}

/** Sección "Qué sigue" del devocional de pareja. */
export function SeccionQueSigueParejas({
  numero,
  nombrePareja,
}: {
  numero: number;
  nombrePareja: string;
}) {
  return (
    <Seccion
      numero={numero}
      titulo="Qué sigue"
      ayuda={`Cada uno escribe por separado. Las respuestas se revelan cuando tú y ${nombrePareja} terminen.`}
    >
      <p className="text-muted text-sm leading-relaxed">
        {nombrePareja} verá el pasaje en cuanto lo guardes. Solo hay un
        devocional de pareja al día.
      </p>
    </Seccion>
  );
}
