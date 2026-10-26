import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export const metadata = { title: "Eliminar tu cuenta" };

export default function EliminarCuentaPage() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl">Eliminar tu cuenta</h1>
      <p>
        Puedes borrar tu cuenta y todo tu contenido en cualquier momento, sin
        escribirnos ni dar explicaciones.
      </p>

      <h2>Desde la app</h2>
      <p>
        Entra a <strong>Ajustes</strong> y elige <strong>Eliminar mi cuenta</strong>.
        Es la forma más rápida.
      </p>
      <p className="mt-5">
        <Link href="/ajustes" className={buttonStyles({ size: "sm" })}>
          Ir a Ajustes
        </Link>
      </p>

      <h2>Qué se borra</h2>
      <ul>
        <li>Tu cuenta y tus datos de acceso.</li>
        <li>
          Tus devocionales, promesas, peticiones de oración y notas personales.
        </li>
        <li>
          Las afirmaciones que enviaste y tu parte del espacio de pareja. Lo que
          tu pareja escribió sigue siendo suyo.
        </li>
      </ul>

      <h2>Qué conservamos</h2>
      <p>
        Solo los eventos de auditoría mínimos que exige la seguridad del
        servicio, sin contenido tuyo.
      </p>

      <h2>Si no puedes entrar</h2>
      <p>
        <Link href="/ayuda" className="text-accent underline">
          Escríbele al equipo
        </Link>{" "}
        y lo hacemos por ti. Elige “Quiero eliminar mi cuenta”.
      </p>
    </>
  );
}
