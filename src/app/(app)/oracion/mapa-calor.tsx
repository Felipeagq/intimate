import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

const NIVELES = [
  { clase: "bg-ink-700/8 dark:bg-white/8", texto: "sin registro" },
  {
    clase: "bg-ink-700/15 dark:bg-white/15 ring-1 ring-dashed ring-ink-700/30",
    texto: "día de gracia",
  },
  { clase: "bg-honey-300", texto: "oraste" },
  { clase: "bg-honey-500", texto: "devocional completo" },
];

export function MapaCalor({
  dias,
  constancia,
}: {
  dias: { fecha: string; nivel: number }[];
  constancia: number;
}) {
  const conRegistro = dias.filter((d) => d.nivel >= 2).length;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="text-xl">Últimos cuatro meses</h2>
        <p className="text-muted text-sm">
          {conRegistro === 0
            ? "Sin registros todavía"
            : `${conRegistro} ${conRegistro === 1 ? "día" : "días"} con registro`}
        </p>
      </div>
      {conRegistro === 0 && (
        <p className="text-muted mt-1 text-sm leading-relaxed">
          En cuanto registres tu primera oración, el mapa empieza a llenarse.
        </p>
      )}

      <div
        className="mt-4 grid grid-flow-col gap-1 overflow-x-auto pb-2"
        style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
        role="img"
        aria-label={`Mapa de constancia: ${constancia}% del mes con oración registrada.`}
      >
        {dias.map((d) => (
          <span
            key={d.fecha}
            title={`${formatDate(d.fecha)} · ${NIVELES[d.nivel].texto}`}
            className={cn("size-3.5 rounded-[4px]", NIVELES[d.nivel].clase)}
          />
        ))}
      </div>

      <ul className="text-muted mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {NIVELES.map((n) => (
          <li key={n.texto} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-[4px]", n.clase)} aria-hidden />
            {n.texto}
          </li>
        ))}
      </ul>
    </Card>
  );
}
