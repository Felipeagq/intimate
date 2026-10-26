"use client";

import { useState } from "react";
import { AlertCircle, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { adminClient } from "@/lib/auth-admin-client";

export function VerificarForm() {
  const [modo, setModo] = useState<"totp" | "respaldo">("totp");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error: err } =
      modo === "totp"
        ? await adminClient.twoFactor.verifyTotp({ code: codigo })
        : await adminClient.twoFactor.verifyBackupCode({ code: codigo });

    setCargando(false);

    if (err) {
      setError(
        err.status === 429
          ? "Demasiados intentos fallidos. La cuenta quedó bloqueada un momento."
          : "El código no es válido. Revisa tu app de autenticación.",
      );
      return;
    }

    // Recarga completa para que el servidor vuelva a leer la cookie.
    window.location.href = "/admin";
  };

  return (
    <Card flat className="p-7">
      <h1 className="text-2xl">Segundo factor</h1>
      <p className="text-muted mt-2 text-sm leading-relaxed">
        {modo === "totp"
          ? "Escribe el código de seis dígitos de tu app de autenticación."
          : "Escribe uno de los códigos de respaldo que guardaste al configurar el MFA."}
      </p>

      <form onSubmit={verificar} className="mt-6">
        <Field htmlFor="codigo-2fa" label="Código">
          <Input
            id="codigo-2fa"
            inputMode={modo === "totp" ? "numeric" : "text"}
            autoComplete="one-time-code"
            required
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.trim())}
            placeholder={modo === "totp" ? "000000" : "xxxxxxxx"}
            className="text-center font-display text-2xl tracking-[0.3em]"
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <Button
          type="submit"
          loading={cargando}
          className="mt-4 w-full"
          disabled={!codigo}
        >
          <KeyRound className="size-4" aria-hidden />
          Verificar
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setModo((m) => (m === "totp" ? "respaldo" : "totp"));
          setCodigo("");
          setError(null);
        }}
        className="text-muted hover:text-foreground mt-5 w-full cursor-pointer text-center text-sm underline transition-colors duration-200"
      >
        {modo === "totp"
          ? "Usar un código de respaldo"
          : "Volver al código de la app"}
      </button>
    </Card>
  );
}
