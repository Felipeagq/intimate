"use client";

import { useState } from "react";
import Link from "next/link";
import { List, Plus, UserPlus } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectorTipo, type EstadoTipo, type Tipo } from "./selector-tipo";
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
  fecha,
}: {
  tienePareja: boolean;
  nombrePareja: string | null;
  miNombre: string;
  devocionalPareja: DevocionalPareja | null;
  personal: Personal | null;
  /** Hoy, ya formateado en la zona de la persona: se calcula en el servidor. */
  fecha: string;
}) {
  const [modo, setModo] = useState<Tipo>(
    tienePareja ? "pareja" : "personal",
  );

  const estados: Record<Tipo, EstadoTipo> = {
    pareja: estadoPareja(tienePareja, devocionalPareja, nombrePareja),
    personal: !personal
      ? { texto: "Sin empezar", tono: "neutral" }
      : personal.completado
        ? { texto: "Terminado", tono: "success" }
        : { texto: "En curso", tono: "honey" },
  };

  return (
    <div>
      <PageHeader
        eyebrow={fecha}
        title={modo === "pareja" ? "Juntos, hoy" : "Tu tiempo con Dios"}
        description={
          modo === "pareja"
            ? "Cada uno escribe por separado. Las respuestas se revelan cuando ambos terminan."
            : "Método SOAP, una sección a la vez. El borrador se guarda al avanzar."
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/devocional/historial"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              <List className="size-4" aria-hidden />
              Ver todos
            </Link>
            <Link
              href="/devocional/nuevo"
              className={buttonStyles({ variant: "ghost", size: "sm" })}
            >
              <Plus className="size-4" aria-hidden />
              Nuevo
            </Link>
          </div>
        }
      />

      <SelectorTipo
        valor={modo}
        onCambiar={setModo}
        orden={["pareja", "personal"]}
        estados={estados}
      />

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

function estadoPareja(
  tienePareja: boolean,
  d: DevocionalPareja | null,
  nombre: string | null,
): EstadoTipo {
  if (!tienePareja) return { texto: "Sin vincular", tono: "neutral" };
  if (!d) return { texto: "Elegir pasaje", tono: "neutral" };
  if (d.revelado) return { texto: "Revelado", tono: "success" };
  if (d.yoRespondi) {
    return { texto: `Falta ${nombre ?? "tu pareja"}`, tono: "warning" };
  }
  return { texto: "Te falta escribir", tono: "honey" };
}
