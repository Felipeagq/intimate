"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fijarZonaHoraria } from "@/actions/perfil";

/**
 * Detecta la zona horaria del navegador una sola vez, la primera vez que
 * alguien entra. No renderiza nada.
 *
 * Solo actúa mientras la zona no esté confirmada: el servidor lo vuelve a
 * comprobar, así que aunque este componente se ejecutara de más, nunca
 * podría pisar una zona que la persona eligió a mano.
 */
export function DetectarZona({ confirmada }: { confirmada: boolean }) {
  const router = useRouter();
  const intentado = useRef(false);

  useEffect(() => {
    if (confirmada || intentado.current) return;
    intentado.current = true;

    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zona) return;

    fijarZonaHoraria(zona, true).then((r) => {
      // Recarga para que las rachas y "hoy" se calculen con la zona nueva.
      if (r.ok) router.refresh();
    });
  }, [confirmada, router]);

  return null;
}
