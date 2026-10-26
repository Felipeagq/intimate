"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Mensaje } from "../mensaje";
import { FormularioPasajePareja } from "../editor-pareja";
import { SelectorTipo, type Tipo } from "../selector-tipo";
import { SeccionesPasaje, SeccionQueSigueSoap } from "../pasaje-campos";
import { crearDevocionalPersonal } from "@/actions/app";

export function NuevoView({
  tienePareja,
  nombrePareja,
  idDeParejaHoy,
}: {
  tienePareja: boolean;
  nombrePareja: string | null;
  idDeParejaHoy: string | null;
}) {
  const [modo, setModo] = useState<Tipo>("personal");
  const router = useRouter();

  return (
    <div>
      {tienePareja && <SelectorTipo valor={modo} onCambiar={setModo} />}

      {modo === "personal" ? (
        <FormularioPersonal alCrear={(id) => router.push(`/devocional/${id}`)} />
      ) : idDeParejaHoy ? (
        <Card className="p-6">
          <BookOpen className="text-accent size-5" aria-hidden />
          <h2 className="mt-3 text-xl">Ya hay uno de pareja para hoy</h2>
          <p className="text-muted mt-2 leading-relaxed">
            El devocional en pareja es uno al día, el mismo para los dos. Ábrelo
            y escribe tu respuesta: se revela cuando {nombrePareja ?? "tu pareja"}{" "}
            también escriba.
          </p>
          <Link
            href={`/devocional/${idDeParejaHoy}`}
            className={buttonStyles({ className: "mt-5" })}
          >
            Abrir el de hoy
          </Link>
        </Card>
      ) : (
        <FormularioPasajePareja
          nombrePareja={nombrePareja ?? "tu pareja"}
          alCrear={(id) => router.push(`/devocional/${id}`)}
        />
      )}
    </div>
  );
}

function FormularioPersonal({ alCrear }: { alCrear: (id: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const crear = (datos: FormData) =>
    iniciar(async () => {
      setError(null);
      const r = await crearDevocionalPersonal({
        pasaje: String(datos.get("pasaje") ?? ""),
        textoPasaje: String(datos.get("texto") ?? "") || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (r.datos) alCrear(r.datos.id);
    });

  return (
    <form action={crear} className="max-w-xl space-y-4">
      <SeccionesPasaje placeholder="Salmo 23" />
      <SeccionQueSigueSoap numero={2} />
      <Button type="submit" loading={pendiente} className="w-full sm:w-auto">
        Empezar el devocional
      </Button>
      <Mensaje error={error} />
    </form>
  );
}
