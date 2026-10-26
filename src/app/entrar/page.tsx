import Link from "next/link";
import { redirect } from "next/navigation";
import { EntrarForm } from "./entrar-form";
import { Logo } from "@/components/brand/logo";
import { googleHabilitado } from "@/server/env";
import { obtenerSesion } from "@/server/session";

export const metadata = { title: "Entrar" };

export default async function EntrarPage() {
  // Quien ya tiene sesión no debería ver el formulario.
  if (await obtenerSesion()) redirect("/inicio");

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex cursor-pointer justify-center"
          aria-label="Intimate, inicio"
        >
          <Logo />
        </Link>

        <EntrarForm googleHabilitado={googleHabilitado} />

        <p className="text-muted mt-6 text-center text-xs leading-relaxed">
          Al continuar aceptas los{" "}
          <Link href="/terminos" className="hover:text-accent underline">
            términos
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="hover:text-accent underline">
            política de privacidad
          </Link>
          . Solo para mayores de 18 años.
        </p>
      </div>
    </main>
  );
}
