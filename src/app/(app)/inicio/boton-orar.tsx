"use client";

import { useState, useTransition } from "react";
import { Check, HandHeart, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { registrarOracion } from "@/actions/app";

export function BotonOrar({
  yaRegistrado,
  nombrePareja,
}: {
  yaRegistrado: boolean;
  nombrePareja: string | null;
}) {
  const [registrado, setRegistrado] = useState(yaRegistrado);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const registrar = () =>
    iniciar(async () => {
      setError(null);
      const r = await registrarOracion();
      if (r.ok) setRegistrado(true);
      else setError(r.error);
    });

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className={
              registrado
                ? "bg-honey-300 text-ink-700 flex size-12 shrink-0 items-center justify-center rounded-2xl"
                : "bg-ink-700/10 text-muted flex size-12 shrink-0 items-center justify-center rounded-2xl dark:bg-white/10"
            }
            aria-hidden
          >
            {registrado ? (
              <Check className="size-5" />
            ) : (
              <HandHeart className="size-5" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-medium">
              {registrado ? "Hoy ya oraste" : "Hoy oré"}
            </p>
            <p className="text-muted text-sm">
              {registrado
                ? nombrePareja
                  ? `Cuenta para tu racha y para la de ustedes dos.`
                  : "Cuenta para tu racha."
                : "Un toque para registrar tu oración del día."}
            </p>
          </div>
        </div>

        {!registrado && (
          <Button onClick={registrar} loading={pendiente}>
            Registrar
          </Button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </Card>
  );
}
