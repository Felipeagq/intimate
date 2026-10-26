"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { aceptarInvitacionEquipo } from "@/actions/equipo-invitacion";

const TONO_ROL = { admin: "honey", soporte: "info", lectura: "neutral" } as const;

export function AceptarInvitacionForm({
  token,
  email,
  rol,
}: {
  token: string;
  email: string;
  rol: string;
}) {
  const router = useRouter();
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const coinciden = contrasena.length > 0 && contrasena === confirmacion;

  const aceptar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinciden) return;

    iniciar(async () => {
      setError(null);
      const r = await aceptarInvitacionEquipo(token, contrasena);
      if (r.ok) {
        router.push("/admin/entrar?cuenta_creada=1");
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <Card flat className="p-7">
      <h1 className="text-2xl">Te invitaron al panel</h1>
      <p className="text-muted mt-2 flex flex-wrap items-center gap-2 text-sm leading-relaxed">
        Vas a entrar como <span className="text-foreground font-medium">{email}</span>
        <Badge tone={TONO_ROL[rol as keyof typeof TONO_ROL] ?? "neutral"}>
          {rol}
        </Badge>
      </p>

      <form onSubmit={aceptar} className="mt-6 space-y-4">
        <Field
          htmlFor="contrasena"
          label="Elige tu contraseña"
          hint="Al menos 12 caracteres"
        >
          <Input
            id="contrasena"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
        </Field>

        <Field htmlFor="confirmacion" label="Repítela">
          <Input
            id="confirmacion"
            type="password"
            required
            autoComplete="new-password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
          />
          {confirmacion.length > 0 && !coinciden && (
            <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">
              No coincide con la de arriba.
            </p>
          )}
        </Field>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <Button
          type="submit"
          loading={pendiente}
          className="w-full"
          disabled={!coinciden}
        >
          <ShieldCheck className="size-4" aria-hidden />
          Crear mi cuenta
        </Button>
      </form>
    </Card>
  );
}
