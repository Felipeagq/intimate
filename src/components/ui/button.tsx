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

const sizes: Record<Size, string> = {
  // min-h-11 = 44px, el mínimo táctil accesible.
  sm: "min-h-11 px-4 text-sm gap-1.5",
  md: "min-h-12 px-5 text-sm gap-2",
  lg: "min-h-14 px-7 text-base gap-2.5",
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
    "inline-flex cursor-pointer items-center justify-center rounded-full font-medium",
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
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
