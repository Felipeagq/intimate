import { cn } from "@/lib/utils";

/**
 * Superficie de vidrio. `flat` quita el desenfoque para zonas densas de datos
 * (tablas del panel admin), donde el blur dificulta la lectura.
 */
export function Card({
  className,
  flat = false,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & { flat?: boolean; interactive?: boolean }) {
  return (
    <div
      className={cn(
        flat ? "panel" : "glass",
        interactive && "glass-hover cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1.5 p-5 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-lg leading-snug font-normal", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-muted text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-3 p-5 pt-0", className)}
      {...props}
    />
  );
}
