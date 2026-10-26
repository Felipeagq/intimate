"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Ban, RotateCcw, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cambiarEstadoCuenta, forzarDesvinculacion } from "@/actions/admin";

type Cuenta = { id: string; email: string; estado: string };
type Pareja = { estado: "activa" | "archivada"; email: string | null } | null;

export function AccionesCuenta({
  cuenta,
  pareja,
  puedeOperar,
}: {
  cuenta: Cuenta;
  pareja: Pareja;
  puedeOperar: boolean;
}) {
  const router = useRouter();
  const [confirmandoDesvinculo, setConfirmandoDesvinculo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const cambiarEstado = (
    estado: "activa" | "suspendida" | "eliminación pendiente",
  ) =>
    iniciar(async () => {
      setError(null);
      const r = await cambiarEstadoCuenta(cuenta.id, estado);
      if (r.ok) router.refresh();
      else setError(r.error);
    });

  const desvincular = () =>
    iniciar(async () => {
      setError(null);
      const r = await forzarDesvinculacion(cuenta.id);
      if (r.ok) {
        setConfirmandoDesvinculo(false);
        router.refresh();
      } else {
        setError(r.error);
      }
    });

  if (!puedeOperar) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {cuenta.estado === "activa" ? (
          <Button
            size="sm"
            variant="secondary"
            loading={pendiente}
            onClick={() => cambiarEstado("suspendida")}
          >
            <Ban className="size-4" aria-hidden />
            Suspender
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            loading={pendiente}
            onClick={() => cambiarEstado("activa")}
          >
            <RotateCcw className="size-4" aria-hidden />
            Reactivar
          </Button>
        )}

        {cuenta.estado !== "eliminación pendiente" && (
          <Button
            size="sm"
            variant="ghost"
            loading={pendiente}
            onClick={() => cambiarEstado("eliminación pendiente")}
          >
            <Trash2 className="size-4" aria-hidden />
            Marcar para eliminar
          </Button>
        )}

        {pareja?.estado === "activa" && !confirmandoDesvinculo && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmandoDesvinculo(true)}
          >
            <UserMinus className="size-4" aria-hidden />
            Forzar desvinculación
          </Button>
        )}
      </div>

      {confirmandoDesvinculo && (
        <div className="rounded-2xl bg-amber-500/12 p-4">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            ¿Desvincular de {pareja?.email}?
          </p>
          <p className="text-muted mt-1 text-sm leading-relaxed">
            Es inmediato y ninguno de los dos recibe aviso. Cada quien conserva
            lo que escribió; el espacio compartido se archiva.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="danger"
              loading={pendiente}
              onClick={desvincular}
            >
              Sí, desvincular
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pendiente}
              onClick={() => setConfirmandoDesvinculo(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
