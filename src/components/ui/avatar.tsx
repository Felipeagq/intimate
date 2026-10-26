import { cn } from "@/lib/utils";

const TAMANOS = {
  sm: { caja: "size-9", texto: "text-sm" },
  md: { caja: "size-11", texto: "text-base" },
  lg: { caja: "size-16", texto: "text-xl" },
  xl: { caja: "size-24", texto: "text-3xl" },
} as const;

type Tamano = keyof typeof TAMANOS;

/**
 * Foto de perfil, con la inicial como respaldo.
 *
 * La URL llega ya firmada desde el servidor y caduca, así que no se puede
 * cachear indefinidamente ni pasar a `next/image`, que la reescribiría.
 */
export function Avatar({
  url,
  nombre,
  tamano = "md",
  className,
}: {
  url: string | null;
  nombre: string;
  tamano?: Tamano;
  className?: string;
}) {
  const { caja, texto } = TAMANOS[tamano];
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-honey-300 text-ink-700",
        caja,
        className,
      )}
    >
      {url ? (
        // La URL está firmada y caduca: el optimizador de Next la
        // reescribiría y la rompería, así que aquí va un <img> a propósito.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`Foto de ${nombre}`}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <span
          className={cn("font-display leading-none font-bold", texto)}
          aria-hidden
        >
          {inicial}
        </span>
      )}
    </span>
  );
}

/**
 * Las dos fotos de la pareja, superpuestas.
 *
 * El borde del color del fondo es lo que separa visualmente los círculos
 * cuando las dos fotos tienen tonos parecidos.
 */
export function AvatarPareja({
  unoUrl,
  unoNombre,
  dosUrl,
  dosNombre,
  tamano = "lg",
  anillo = "normal",
  className,
}: {
  unoUrl: string | null;
  unoNombre: string;
  dosUrl: string | null;
  dosNombre: string;
  tamano?: Tamano;
  /** "fino" para tamaños chicos, donde un anillo grueso se come la foto. */
  anillo?: "normal" | "fino";
  className?: string;
}) {
  const solape =
    tamano === "xl"
      ? "-ml-7"
      : tamano === "lg"
        ? "-ml-5"
        : anillo === "fino"
          ? "-ml-4"
          : "-ml-3.5";
  const grosor = anillo === "fino" ? "ring-2" : "ring-4";

  return (
    <span
      className={cn("inline-flex items-center", className)}
      role="img"
      aria-label={`${unoNombre} y ${dosNombre}`}
    >
      <Avatar
        url={unoUrl}
        nombre={unoNombre}
        tamano={tamano}
        className={cn("ring-background", grosor)}
      />
      <Avatar
        url={dosUrl}
        nombre={dosNombre}
        tamano={tamano}
        className={cn("ring-background", grosor, solape)}
      />
    </span>
  );
}
