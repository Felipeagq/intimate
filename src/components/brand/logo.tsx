import { cn } from "@/lib/utils";

/**
 * Marca de Intimate: dos personas bajo un corazón con la cruz.
 * Reconstruido como SVG a partir de logo.png para que escale sin pérdida
 * y herede el color del tema. La cruz es una máscara, no un relleno sólido,
 * así se ve el fondo a través de ella sobre cualquier superficie.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Intimate"
      className={cn("size-10", className)}
      fill="currentColor"
    >
      <defs>
        <mask id="intimate-cross">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <rect x="48.3" y="12" width="3.4" height="19" rx="0.6" fill="black" />
          <rect
            x="43.5"
            y="18.4"
            width="13"
            height="3.4"
            rx="0.6"
            fill="black"
          />
        </mask>
      </defs>

      <g transform="translate(32 5.5) scale(1.5)" mask="url(#intimate-cross)">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </g>

      <circle cx="33" cy="52" r="10.5" />
      <circle cx="67" cy="52" r="10.5" />
      <path d="M17 80a16 16 0 0132 0v8a2 2 0 01-2 2H19a2 2 0 01-2-2z" />
      <path d="M51 80a16 16 0 0132 0v8a2 2 0 01-2 2H53a2 2 0 01-2-2z" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-xl tracking-tight",
        className,
      )}
    >
      Intimate
    </span>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("size-8", markClassName)} />
      <Wordmark />
    </span>
  );
}
