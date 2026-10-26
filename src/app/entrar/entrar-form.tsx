"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";

export function EntrarForm({ googleHabilitado }: { googleHabilitado: boolean }) {
  const router = useRouter();
  const [paso, setPaso] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pedirCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error: err } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    setCargando(false);
    if (err) {
      setError(err.message ?? "No pudimos enviar el código. Inténtalo de nuevo.");
      return;
    }
    setPaso("codigo");
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error: err } = await authClient.signIn.emailOtp({ email, otp: codigo });

    setCargando(false);
    if (err) {
      setError(
        err.message ?? "El código no es válido o ya caducó. Pide uno nuevo.",
      );
      return;
    }
    router.push("/inicio");
    router.refresh();
  };

  const entrarConGoogle = async () => {
    setError(null);
    await authClient.signIn.social({ provider: "google", callbackURL: "/inicio" });
  };

  if (paso === "codigo") {
    return (
      <Card className="p-7">
        <button
          type="button"
          onClick={() => {
            setPaso("email");
            setError(null);
          }}
          className="text-muted hover:text-foreground mb-5 flex cursor-pointer items-center gap-1.5 text-sm transition-colors duration-200"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Cambiar correo
        </button>

        <h1 className="text-2xl">Revisa tu correo</h1>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          Enviamos un código de seis dígitos a{" "}
          <span className="text-foreground font-medium">{email}</span>. Caduca
          en diez minutos.
        </p>

        <form onSubmit={entrar} className="mt-6">
          <Field htmlFor="codigo" label="Código">
            <Input
              id="codigo"
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

          <ErrorMsg error={error} />

          <Button
            type="submit"
            loading={cargando}
            disabled={codigo.length !== 6}
            className="mt-4 w-full"
          >
            Entrar
          </Button>
        </form>

        <p className="text-muted mt-5 text-center text-sm">
          ¿No llegó?{" "}
          <button
            type="button"
            onClick={() =>
              authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })
            }
            className="text-accent cursor-pointer font-medium underline"
          >
            Reenviar
          </button>
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="text-2xl">Entra a Intimate</h1>
      <p className="text-muted mt-2 text-sm leading-relaxed">
        Te mandamos un código al correo. Sin contraseñas que recordar.
      </p>

      <form onSubmit={pedirCodigo} className="mt-6">
        <Field htmlFor="email" label="Tu correo">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </Field>

        <ErrorMsg error={error} />

        <Button
          type="submit"
          loading={cargando}
          className="mt-4 w-full"
          disabled={!email.includes("@")}
        >
          <Mail className="size-4" aria-hidden />
          Enviar código
        </Button>
      </form>

      {/* El botón solo existe si Google está configurado en el servidor.
          Un botón que no hace nada es peor que no tenerlo. */}
      {googleHabilitado && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="bg-ink-700/12 h-px flex-1 dark:bg-white/12" aria-hidden />
            <span className="text-muted text-xs">o</span>
            <span className="bg-ink-700/12 h-px flex-1 dark:bg-white/12" aria-hidden />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={entrarConGoogle}
          >
            <GoogleIcon />
            Continuar con Google
          </Button>
        </>
      )}
    </Card>
  );
}

function ErrorMsg({ error }: { error: string | null }) {
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 010-4.22V7.05H2.18a11 11 0 000 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
