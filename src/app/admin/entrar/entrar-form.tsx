"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { adminClient } from "@/lib/auth-admin-client";

export function AdminEntrarForm({
  cuentaCreada = false,
}: {
  cuentaCreada?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { data, error: err } = await adminClient.signIn.email({
      email,
      password: contrasena,
    });

    setCargando(false);

    if (err) {
      // Mensaje genérico: no revelamos si el correo existe.
      setError("Correo o contraseña incorrectos.");
      return;
    }

    // Con 2FA activo, el plugin ya redirigió a /admin/verificar.
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) return;

    router.push("/admin/configurar-mfa");
    router.refresh();
  };

  return (
    <Card flat className="p-7">
      <h1 className="text-2xl">Acceso del equipo</h1>
      <p className="text-muted mt-2 text-sm leading-relaxed">
        Solo para cuentas del equipo, con segundo factor obligatorio. Esta
        sesión no sirve para entrar como usuario de la app.
      </p>

      {cuentaCreada && (
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-600/12 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
          <Check className="size-4 shrink-0" aria-hidden />
          Tu cuenta quedó creada. Entra con tu correo y tu contraseña nueva.
        </p>
      )}

      <form onSubmit={entrar} className="mt-6 space-y-4">
        <Field htmlFor="admin-email" label="Correo del equipo">
          <Input
            id="admin-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@feanware.com"
          />
        </Field>

        <Field htmlFor="admin-pass" label="Contraseña">
          <Input
            id="admin-pass"
            type="password"
            required
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
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
          loading={cargando}
          className="w-full"
          disabled={!email || !contrasena}
        >
          <ShieldCheck className="size-4" aria-hidden />
          Continuar
        </Button>
      </form>
    </Card>
  );
}
