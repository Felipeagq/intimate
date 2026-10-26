"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { pedirPermisoDeSubida, confirmarFoto, quitarFoto } from "@/actions/foto";

const LADO = 512;
const CALIDAD = 0.85;

/**
 * Recorta al centro y reduce a 512 px antes de subir.
 *
 * Se hace en el navegador a propósito: una foto de móvil pesa varios
 * megas, y procesarla aquí evita subirla entera, ahorra tiempo al usuario
 * y quita la necesidad de una librería de imágenes en el servidor.
 */
async function prepararImagen(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);

  const lado = Math.min(bitmap.width, bitmap.height);
  const x = (bitmap.width - lado) / 2;
  const y = (bitmap.height - lado) / 2;

  const lienzo = document.createElement("canvas");
  lienzo.width = LADO;
  lienzo.height = LADO;

  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo procesar la imagen.");

  ctx.drawImage(bitmap, x, y, lado, lado, 0, 0, LADO, LADO);
  bitmap.close();

  return new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) =>
        blob ? resolver(blob) : rechazar(new Error("No pudimos procesar la imagen.")),
      "image/jpeg",
      CALIDAD,
    );
  });
}

export function SubirFoto({
  urlActual,
  nombre,
}: {
  urlActual: string | null;
  nombre: string;
}) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const elegir = async (archivo: File) => {
    setError(null);

    if (!archivo.type.startsWith("image/")) {
      setError("Elige una imagen.");
      return;
    }

    setSubiendo(true);
    let objeto: string | null = null;

    try {
      const blob = await prepararImagen(archivo);
      objeto = URL.createObjectURL(blob);
      setVistaPrevia(objeto);

      const permiso = await pedirPermisoDeSubida("image/jpeg", blob.size);
      if (!permiso.ok) throw new Error(permiso.error);

      // La imagen va directa a S3; no pasa por el servidor de la app.
      const subida = await fetch(permiso.datos.url, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (!subida.ok) {
        throw new Error(
          `El almacenamiento rechazó la subida (${subida.status}). Puede faltar la configuración CORS del bucket.`,
        );
      }

      const guardada = await confirmarFoto(permiso.datos.clave);
      if (!guardada.ok) throw new Error(guardada.error);

      router.refresh();
    } catch (e) {
      setVistaPrevia(null);
      setError(e instanceof Error ? e.message : "No pudimos subir la foto.");
    } finally {
      if (objeto) setTimeout(() => URL.revokeObjectURL(objeto!), 5000);
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  const quitar = () =>
    iniciar(async () => {
      setError(null);
      const r = await quitarFoto();
      if (r.ok) {
        setVistaPrevia(null);
        router.refresh();
      } else {
        setError(r.error);
      }
    });

  const mostrada = vistaPrevia ?? urlActual;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-5">
        <Avatar url={mostrada} nombre={nombre} tamano="xl" />

        <div className="flex flex-wrap gap-2">
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id="foto-perfil"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) elegir(archivo);
            }}
          />

          <Button
            type="button"
            variant="secondary"
            loading={subiendo}
            onClick={() => entrada.current?.click()}
          >
            <Camera className="size-4" aria-hidden />
            {mostrada ? "Cambiar foto" : "Subir foto"}
          </Button>

          {urlActual && (
            <Button
              type="button"
              variant="ghost"
              loading={pendiente}
              onClick={quitar}
            >
              <Trash2 className="size-4" aria-hidden />
              Quitar
            </Button>
          )}
        </div>
      </div>

      <p className="text-muted mt-4 text-xs leading-relaxed">
        Se recorta en cuadrado y se reduce a 512 píxeles antes de subirla. Se
        guarda en un espacio privado: solo tú y tu pareja pueden verla, con
        enlaces que caducan.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
