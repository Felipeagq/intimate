import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Cuenta suspendida" };

export default function CuentaSuspendidaPage() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card className="p-8 text-center">
          <ShieldAlert className="text-muted mx-auto size-8" aria-hidden />
          <h1 className="mt-4 text-2xl">Tu cuenta está suspendida</h1>
          <p className="text-muted mt-3 leading-relaxed">
            No puedes entrar por ahora. Lo que escribiste sigue guardado y no se
            ha borrado nada.
          </p>
          <p className="text-muted mt-4 text-sm leading-relaxed">
            Si crees que es un error, escríbenos a{" "}
            <a href="mailto:hola@intimate.app" className="text-accent underline">
              hola@intimate.app
            </a>{" "}
            desde el correo de tu cuenta.
          </p>
        </Card>
      </div>
    </main>
  );
}
