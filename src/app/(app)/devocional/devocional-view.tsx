"use client";

import { useState } from "react";
import Link from "next/link";
import { List, UserPlus } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  DevocionalParejaDetalle,
  FormularioPasajePareja,
  type DevocionalPareja,
} from "./editor-pareja";
import { EditorPersonal, type Personal } from "./editor-personal";

export function DevocionalView({
  tienePareja,
  nombrePareja,
  miNombre,
  devocionalPareja,
  personal,
}: {
  tienePareja: boolean;
  nombrePareja: string | null;
  miNombre: string;
  devocionalPareja: DevocionalPareja | null;
  personal: Personal | null;
}) {
  const [modo, setModo] = useState<"pareja" | "personal">(
    tienePareja ? "pareja" : "personal",
  );

  return (
    <div>
      <PageHeader
        eyebrow="Devocional"
        title={modo === "pareja" ? "Juntos, hoy" : "Tu tiempo con Dios"}
        description={
          modo === "pareja"
            ? "Cada uno escribe por separado. Las respuestas se revelan cuando ambos terminan."
            : "Método SOAP, una sección a la vez. El borrador se guarda al avanzar."
        }
        action={
          <Link
            href="/devocional/historial"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            <List className="size-4" aria-hidden />
            Ver todos
          </Link>
        }
      />

      <div
        role="tablist"
        aria-label="Tipo de devocional"
        className="glass mb-5 inline-flex gap-1 p-1.5"
      >
        {(["pareja", "personal"] as const).map((m) => (
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
            {m === "pareja" ? "En pareja" : "Personal"}
          </button>
        ))}
      </div>

      {modo === "pareja" ? (
        !tienePareja ? (
          <EmptyState
            icon={UserPlus}
            titulo="El devocional en pareja necesita a los dos"
            descripcion="Cuando tu pareja acepte la invitación, podrán elegir un pasaje y escribir cada uno por su lado."
            accion={
              <Link href="/vincular" className={buttonStyles()}>
                Invitar a mi pareja
              </Link>
            }
          />
        ) : devocionalPareja ? (
          <DevocionalParejaDetalle
            devocional={devocionalPareja}
            nombrePareja={nombrePareja ?? "tu pareja"}
            miNombre={miNombre}
          />
        ) : (
          <FormularioPasajePareja nombrePareja={nombrePareja ?? "tu pareja"} />
        )
      ) : (
        <EditorPersonal inicial={personal} />
      )}
    </div>
  );
}
