"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Trash2, UserMinus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { desvincular } from "@/actions/app";

export function ZonaDelicada({
  nombrePareja,
  vinculadaEn,
}: {
  nombrePareja: string | null;
  vinculadaEn: string | null;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const salir = () =>
    iniciar(async () => {
      setError(null);
      const r = await desvincular();
      if (r.ok) {
        setConfirmando(false);
        router.refresh();
      } else {
        setError(r.error);
      }
    });

  return (
    <Card className="border-red-900/15 p-6 dark:border-red-400/20">
      <h2 className="text-xl">Zona delicada</h2>

      {nombrePareja && (
        <div className="border-ink-700/10 mt-5 border-t pt-5 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium">Desvincularme de {nombrePareja}</p>
              <p className="text-muted mt-1 max-w-md text-sm leading-relaxed">
                Es inmediato y {nombrePareja} no recibe aviso. Conservas todo lo
                que tú escribiste; el espacio compartido se archiva y ninguno de
                los dos podrá leer lo del otro.
                {vinculadaEn && ` Vinculados desde el ${vinculadaEn}.`}
              </p>
            </div>
            {!confirmando && (
              <Button variant="secondary" onClick={() => setConfirmando(true)}>
                <UserMinus className="size-4" aria-hidden />
                Desvincular
              </Button>
            )}
          </div>

          {confirmando && (
            <div className="bg-ink-700/5 mt-4 rounded-2xl p-4 dark:bg-white/5">
              <p className="text-sm font-medium">
                ¿Seguro? Esto no se puede deshacer.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="danger" onClick={salir} loading={pendiente}>
                  Sí, desvincularme
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmando(false)}
                  disabled={pendiente}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-ink-700/10 mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5 dark:border-white/10">
        <div className="min-w-0">
          <p className="font-medium">Eliminar mi cuenta</p>
          <p className="text-muted mt-1 max-w-md text-sm leading-relaxed">
            Borra tu cuenta y todo tu contenido. Todavía no está construido;
            mientras tanto, escríbenos y lo hacemos por ti.
          </p>
        </div>
        <Button variant="danger" disabled>
          <Trash2 className="size-4" aria-hidden />
          Eliminar
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </Card>
  );
}
