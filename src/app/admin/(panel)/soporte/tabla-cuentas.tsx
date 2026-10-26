"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Ban, RotateCcw, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";
import { cambiarEstadoCuenta } from "@/actions/admin";

type Cuenta = {
  id: string;
  email: string;
  estado: string;
  pareja: string;
  creada: string;
  ultimoAcceso: string | null;
};

const TONO: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  activa: "success",
  suspendida: "warning",
  "eliminación pendiente": "danger",
};

export function TablaCuentas({
  cuentas,
  busquedaInicial,
  puedeOperar,
}: {
  cuentas: Cuenta[];
  busquedaInicial: string;
  puedeOperar: boolean;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const cambiar = (
    id: string,
    estado: "activa" | "suspendida" | "eliminación pendiente",
  ) =>
    iniciar(async () => {
      setError(null);
      const r = await cambiarEstadoCuenta(id, estado);
      if (!r.ok) setError(r.error);
    });

  return (
    <>
      <Card flat className="mb-4 p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(
              busqueda.trim()
                ? `/admin/soporte?q=${encodeURIComponent(busqueda.trim())}`
                : "/admin/soporte",
            );
          }}
        >
          <label htmlFor="buscar" className="sr-only">
            Buscar cuenta por correo
          </label>
          <div className="relative">
            <Search
              className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="buscar"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="pl-11"
            />
          </div>
        </form>
      </Card>

      {error && (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {cuentas.length === 0 ? (
        <Card flat className="p-8 text-center">
          <p className="text-muted">
            Ninguna cuenta coincide con “{busquedaInicial}”.
          </p>
        </Card>
      ) : (
        <Card flat className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Cuentas de usuario</caption>
              <thead className="border-ink-700/10 border-b dark:border-white/10">
                <tr className="text-muted text-left">
                  {["Correo", "Estado", "Pareja", "Último acceso", "Creada", ""].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-5 py-3 font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {cuentas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-ink-700/8 border-b last:border-0 dark:border-white/8"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium">{c.email}</p>
                      <p className="text-muted font-mono text-xs">
                        {c.id.slice(0, 12)}…
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={TONO[c.estado] ?? "neutral"}>
                        {c.estado}
                      </Badge>
                    </td>
                    <td className="text-muted px-5 py-4 whitespace-nowrap">
                      {c.pareja}
                    </td>
                    <td className="text-muted px-5 py-4 whitespace-nowrap">
                      {c.ultimoAcceso ? formatDate(c.ultimoAcceso) : "nunca"}
                    </td>
                    <td className="text-muted px-5 py-4 whitespace-nowrap">
                      {formatDate(c.creada)}
                    </td>
                    <td className="px-5 py-4">
                      {puedeOperar && (
                        <div className="flex justify-end gap-1.5">
                          {c.estado === "activa" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pendiente}
                              onClick={() => cambiar(c.id, "suspendida")}
                              aria-label={`Suspender ${c.email}`}
                            >
                              <Ban className="size-4" aria-hidden />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pendiente}
                              onClick={() => cambiar(c.id, "activa")}
                              aria-label={`Reactivar ${c.email}`}
                            >
                              <RotateCcw className="size-4" aria-hidden />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pendiente}
                            onClick={() =>
                              cambiar(c.id, "eliminación pendiente")
                            }
                            aria-label={`Marcar ${c.email} para eliminación`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
