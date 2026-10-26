"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { BuscarPasaje } from "@/components/buscar-pasaje";
import { cn } from "@/lib/utils";
import { Mensaje } from "../mensaje";
import { FormularioPasajePareja } from "../editor-pareja";
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
  const [modo, setModo] = useState<"personal" | "pareja">("personal");
  const router = useRouter();

  return (
    <div>
      {tienePareja && (
        <div
          role="tablist"
          aria-label="Tipo de devocional"
          className="glass mb-5 inline-flex gap-1 p-1.5"
        >
          {(["personal", "pareja"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={modo === m}
              onClick={() => setModo(m)}
              className={cn(
                "min-h-11 cursor-pointer rounded-2xl px-5 text-sm font-medium transition-colors duration-200",
                modo === m
                  ? "bg-honey-300 text-ink-700"
                  : "text-muted hover:text-foreground",
              )}
            >
              {m === "personal" ? "Personal" : "En pareja"}
            </button>
          ))}
        </div>
      )}

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
  const [pasaje, setPasaje] = useState("");
  const [texto, setTexto] = useState("");
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
    <Card className="p-6">
      <h2 className="text-2xl">Tu tiempo con Dios</h2>
      <p className="text-muted mt-2 leading-relaxed">
        Escribe la cita y, si quieres, trae el texto. Después sigues el método
        SOAP sección por sección; el borrador se guarda al avanzar.
      </p>

      <form action={crear} className="mt-6 space-y-4">
        <Field htmlFor="pasaje" label="Pasaje">
          <Input
            id="pasaje"
            name="pasaje"
            required
            maxLength={120}
            value={pasaje}
            onChange={(e) => setPasaje(e.target.value)}
            placeholder="Salmo 23"
          />
        </Field>
        <BuscarPasaje
          referencia={pasaje}
          uso="devocional"
          onEncontrado={(p) => {
            setPasaje(p.referencia);
            setTexto(p.texto);
          }}
        />
        <Field
          htmlFor="texto"
          label="Texto del pasaje"
          hint="Opcional: se llena con “Traer el texto”"
        >
          <Textarea
            id="texto"
            name="texto"
            className="min-h-28"
            maxLength={4000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={pendiente}>
          Empezar el devocional
        </Button>
      </form>

      <Mensaje error={error} />
    </Card>
  );
}
