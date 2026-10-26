import { ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export const metadata = { title: "Entrar al panel" };

export default function AdminEntrarPage() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <LogoMark className="size-7" />
          <span className="font-display text-lg">
            Intimate
          </span>
          <Badge tone="neutral" className="text-[0.6rem]">
            Panel
          </Badge>
        </div>

        <Card flat className="p-7">
          <h1 className="text-2xl">Acceso del equipo</h1>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Este acceso es solo para cuentas del equipo y exige segundo factor.
            No sirve para entrar como usuario.
          </p>

          <form className="mt-6 space-y-4">
            <Field htmlFor="admin-email" label="Correo del equipo">
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="tu@feanware.com"
              />
            </Field>
            <Field htmlFor="admin-pass" label="Contraseña">
              <Input
                id="admin-pass"
                type="password"
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" className="w-full">
              Continuar
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="bg-ink-700/12 h-px flex-1 dark:bg-white/12" aria-hidden />
            <span className="text-muted text-xs">o</span>
            <span className="bg-ink-700/12 h-px flex-1 dark:bg-white/12" aria-hidden />
          </div>

          <Button variant="secondary" className="w-full">
            <ShieldCheck className="size-4" aria-hidden />
            Entrar con passkey
          </Button>
        </Card>

        <p className="text-muted mt-6 text-center text-xs leading-relaxed">
          Cada intento de acceso queda registrado en auditoría.
        </p>
      </div>
    </main>
  );
}
