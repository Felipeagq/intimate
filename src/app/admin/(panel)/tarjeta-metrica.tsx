import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DatoMetrica = { valor: number; delta: number | null };

/**
 * Tarjeta de una métrica del dashboard.
 *
 * Compacta a propósito: en teléfono van de a dos por fila, así que el
 * rótulo ocupa la parte de arriba y la cifra se queda abajo, alineada con
 * la de la tarjeta vecina aunque un rótulo ocupe dos líneas. La destacada
 * (la métrica norte) lleva más cifra y un borde de la marca.
 */
export function TarjetaMetrica({
  label,
  dato,
  sufijo,
  nota,
  destacada = false,
  className,
}: {
  label: string;
  dato: DatoMetrica;
  sufijo?: string;
  nota?: string;
  destacada?: boolean;
  className?: string;
}) {
  const sube = (dato.delta ?? 0) >= 0;
  const Icono = dato.delta === null ? Minus : sube ? TrendingUp : TrendingDown;

  return (
    <Card
      flat
      className={cn(
        "flex flex-col justify-between gap-3 p-4",
        destacada && "ring-honey-500/50 p-5 ring-1",
        className,
      )}
    >
      <p
        className={cn(
          "text-muted leading-snug",
          destacada ? "text-sm" : "text-xs",
        )}
      >
        {label}
      </p>

      <div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p
            className={cn(
              "font-display leading-none tabular-nums",
              destacada ? "text-5xl" : "text-3xl",
            )}
          >
            {dato.valor.toLocaleString("es")}
            {sufijo}
          </p>

          {dato.delta !== null && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                sube
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-amber-800 dark:text-amber-300",
              )}
            >
              <Icono className="size-3.5" aria-hidden />
              {sube ? "+" : ""}
              {dato.delta}%
              <span className="sr-only"> frente a la semana anterior</span>
            </span>
          )}
        </div>

        {nota && <p className="text-muted mt-2 text-xs leading-snug">{nota}</p>}
      </div>
    </Card>
  );
}
