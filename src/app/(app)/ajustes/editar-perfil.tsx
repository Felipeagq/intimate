"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { actualizarPerfil } from "@/actions/perfil";

export function EditarPerfil({
  nombreInicial,
  telefonoInicial,
}: {
  nombreInicial: string;
  telefonoInicial: string | null;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState(telefonoInicial ?? "");
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const sinCambios =
    nombre.trim() === nombreInicial.trim() &&
    telefono.trim() === (telefonoInicial ?? "").trim();

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      setError(null);
      setGuardado(false);

      const r = await actualizarPerfil({ nombre, telefono });
      if (r.ok) {
        setGuardado(true);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <form onSubmit={guardar} className="space-y-4">
      <Field
        htmlFor="nombre"
        label="Cómo te llamas"
        hint="Es lo que ve tu pareja"
      >
        <Input
          id="nombre"
          required
          maxLength={60}
          autoComplete="name"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setGuardado(false);
          }}
          placeholder="Sofía"
        />
      </Field>

      <Field
        htmlFor="telefono"
        label="Teléfono"
        hint="Opcional, con código de país"
      >
        <Input
          id="telefono"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={telefono}
          onChange={(e) => {
            setTelefono(e.target.value);
            setGuardado(false);
          }}
          placeholder="+57 300 123 4567"
        />
      </Field>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pendiente} disabled={sinCambios}>
          Guardar cambios
        </Button>
        {guardado && (
          <span className="text-muted flex items-center gap-1.5 text-sm">
            <Check
              className="size-4 text-emerald-700 dark:text-emerald-400"
              aria-hidden
            />
            Guardado
          </span>
        )}
      </div>

      <p className="text-muted text-xs leading-relaxed">
        El teléfono todavía no está verificado ni se usa para avisos. Cuando
        conectemos los mensajes, habrá que confirmarlo con un código: un
        número sin comprobar no sirve como canal de seguridad.
      </p>
    </form>
  );
}
