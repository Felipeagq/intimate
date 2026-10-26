import { AlertCircle } from "lucide-react";

/** Error de un guardado, en el sitio donde la persona acaba de pulsar. */
export function Mensaje({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {error}
    </p>
  );
}
