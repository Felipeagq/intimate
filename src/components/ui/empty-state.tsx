import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

/**
 * Estado vacío. Dice qué falta y qué hacer, nunca solo "no hay datos":
 * la primera pantalla que ve alguien recién llegado es esta.
 */
export function EmptyState({
  icon: Icon,
  titulo,
  descripcion,
  accion,
  className,
  flat = false,
}: {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
  className?: string;
  flat?: boolean;
}) {
  return (
    <Card flat={flat} className={cn("p-10 text-center", className)}>
      <span className="bg-honey-300/40 text-ink-700 mx-auto flex size-14 items-center justify-center rounded-2xl dark:text-honey-300 dark:bg-white/10">
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl">{titulo}</h2>
      <p className="text-muted mx-auto mt-2 max-w-sm leading-relaxed">
        {descripcion}
      </p>
      {accion && <div className="mt-6 flex justify-center">{accion}</div>}
    </Card>
  );
}
