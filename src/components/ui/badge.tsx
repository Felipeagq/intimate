import { cn } from "@/lib/utils";

type Tone = "neutral" | "honey" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-700/10 text-foreground dark:bg-white/12",
  honey: "bg-honey-300 text-ink-700",
  success: "bg-emerald-600/15 text-emerald-900 dark:text-emerald-300",
  warning: "bg-amber-500/18 text-amber-900 dark:text-amber-200",
  danger: "bg-red-600/15 text-red-900 dark:text-red-300",
  info: "bg-sky-600/15 text-sky-900 dark:text-sky-300",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
