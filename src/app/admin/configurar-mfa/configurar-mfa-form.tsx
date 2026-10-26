"use client";

import { useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { AlertCircle, Copy, Check, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { adminClient } from "@/lib/auth-admin-client";

export function ConfigurarMfaForm({ email }: { email: string }) {
  const [paso, setPaso] = useState<"contrasena" | "escanear">("contrasena");
  const [contrasena, setContrasena] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [respaldo, setRespaldo] = useState<string[]>([]);
  const [codigo, setCodigo] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { data, error: err } = await adminClient.twoFactor.enable({
      password: contrasena,
      method: "totp",
    });

    if (err || !data) {
      setCargando(false);
      setError("La contraseña no es correcta.");
      return;
    }

    // El QR se genera aquí, en el navegador: el URI del TOTP es un secreto
    // y no debe pasar por un servicio de terceros.
    const dataUrl = await QRCode.toDataURL(data.totpURI, {
      margin: 1,
      width: 320,
      color: { dark: "#433636", light: "#f8f4f1" },
    });

    setQr(dataUrl);
    setRespaldo(data.backupCodes ?? []);
    setPaso("escanear");
    setCargando(false);
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error: err } = await adminClient.twoFactor.verifyTotp({
      code: codigo,
    });

    setCargando(false);

    if (err) {
      setError("El código no coincide. Revisa la hora de tu dispositivo.");
      return;
    }

    window.location.href = "/admin";
  };

  if (paso === "contrasena") {
    return (
      <Card flat className="p-7">
        <h1 className="text-2xl">Configura tu segundo factor</h1>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          Entraste como <span className="text-foreground font-medium">{email}</span>.
          Confirma tu contraseña para generar el código de tu app de
          autenticación.
        </p>

        <form onSubmit={activar} className="mt-6">
          <Field htmlFor="pass-mfa" label="Tu contraseña">
            <Input
              id="pass-mfa"
              type="password"
              required
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </Field>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Button
            type="submit"
            loading={cargando}
            className="mt-4 w-full"
            disabled={!contrasena}
          >
            Generar código
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card flat className="p-7">
      <h1 className="text-2xl">Escanea el código</h1>
      <p className="text-muted mt-2 text-sm leading-relaxed">
        Ábrelo con Google Authenticator, 1Password o la app que uses.
      </p>

      {qr && (
        <div className="mt-5 flex justify-center">
          <Image
            src={qr}
            alt="Código QR para configurar el segundo factor"
            width={220}
            height={220}
            unoptimized
            className="rounded-2xl"
          />
        </div>
      )}

      {respaldo.length > 0 && (
        <div className="bg-honey-300/25 mt-5 rounded-2xl p-4">
          <p className="text-sm font-medium">Códigos de respaldo</p>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            Guárdalos ahora. Son tu única forma de entrar si pierdes el
            dispositivo, y no se vuelven a mostrar.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 font-mono text-xs">
            {respaldo.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(respaldo.join("\n"));
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              } catch {
                // Sin portapapeles siguen visibles para copiarlos a mano.
              }
            }}
          >
            {copiado ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copiado ? "Copiados" : "Copiar"}
          </Button>
        </div>
      )}

      <form onSubmit={confirmar} className="mt-6">
        <Field
          htmlFor="codigo-mfa"
          label="Código de la app"
          hint="Seis dígitos"
        >
          <Input
            id="codigo-mfa"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={codigo}
            onChange={(e) =>
              setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000000"
            className="text-center font-display text-2xl tracking-[0.4em]"
          />
        </Field>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Button
          type="submit"
          loading={cargando}
          className="mt-4 w-full"
          disabled={codigo.length !== 6}
        >
          <ShieldCheck className="size-4" aria-hidden />
          Activar y entrar
        </Button>
      </form>
    </Card>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
