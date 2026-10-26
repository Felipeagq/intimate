import { cn } from "@/lib/utils";

const control = [
  "w-full rounded-2xl px-4 py-3 text-base",
  "bg-white/55 dark:bg-white/6",
  "border border-[var(--glass-border)]",
  "text-foreground placeholder:text-muted/70",
  "transition-colors duration-200 ease-out",
  "focus:border-accent focus:bg-white/80 dark:focus:bg-white/10 focus:outline-none",
].join(" ");

export function Label({
  className,
  children,
  hint,
  ...props
}: React.ComponentProps<"label"> & { hint?: string }) {
  return (
    <label
      className={cn("mb-1.5 flex items-baseline gap-2 text-sm", className)}
      {...props}
    >
      <span className="font-medium">{children}</span>
      {hint && <span className="text-muted text-xs">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, "min-h-12", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(control, "min-h-32 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

/** Campo completo: etiqueta vinculada por `for`, control y mensaje de error. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
