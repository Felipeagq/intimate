import { PedirAyuda } from "@/components/pedir-ayuda";

export const metadata = { title: "Escríbele al equipo" };

export default function AyudaPage() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl">Escríbele al equipo</h1>
      <p>
        Para dudas, para reportar algo que te preocupa, para pedir que
        eliminemos tu cuenta, o si no puedes entrar. No hace falta tener la
        sesión abierta.
      </p>

      <div className="mt-8 not-prose">
        <PedirAyuda modo="publico" />
      </div>
    </>
  );
}
