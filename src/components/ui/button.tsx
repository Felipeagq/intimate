import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-honey-300 text-ink-700 hover:bg-honey-500 shadow-[0_4px_16px_-4px_rgb(233_199_102/0.6)]",
  secondary: "glass glass-hover text-foreground",
  ghost: "text-foreground hover:bg-ink-700/8 dark:hover:bg-white/10",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

// Escala única. Todo botón de la app usa una de estas tres:
//   sm — acciones dentro de una fila, tarjeta o tabla, y el panel de admin
//   md — la acción principal de un formulario o tarjeta (por defecto)
//   lg — solo la portada
// min-h-11 = 44px, el mínimo táctil accesible. El ancho mínimo evita que dos
// botones contiguos ("Minutos" / "Registrar") queden de anchos desparejos.
const sizes: Record<Size, string> = {
  sm: "min-h-11 min-w-24 px-4 text-sm gap-2",
  md: "min-h-12 min-w-28 px-6 text-sm gap-2",
  lg: "min-h-14 min-w-36 px-8 text-base gap-2.5",
};

/**
 * Estilos del botón, para aplicarlos a un `<Link>` sin anidar un enlace
 * dentro de un `<button>` (HTML inválido y trampa de accesibilidad).
 */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-full font-medium whitespace-nowrap select-none",
    // Los iconos miden lo mismo en todos los botones, salvo que traigan tamaño.
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    "transition-colors duration-200 ease-out",
    "disabled:cursor-not-allowed disabled:opacity-55",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
