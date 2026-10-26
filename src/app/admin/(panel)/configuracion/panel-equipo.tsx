"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock,
  KeyRound,
  Mail,
  Plus,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";
import {
  crearInvitacionEquipo,
  revocarInvitacionEquipo,
} from "@/actions/admin";
import type { Rol } from "@/server/auth-admin";

const TONO_ROL = { admin: "honey", soporte: "info", lectura: "neutral" } as const;

type Miembro = {
  id: string;
  email: string;
  rol: string;
  mfa: boolean;
  creada: string;
};

type Invitacion = { id: string; email: string; rol: string; expiraEn: string };

export function PanelEquipo({
  miCorreo,
  equipo,
  invitaciones,
}: {
  miCorreo: string;
  equipo: Miembro[];
  invitaciones: Invitacion[];
}) {
  const router = useRouter();
  const [formulario, setFormulario] = useState(false);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol>("lectura");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const invitar = (e: React.FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      setError(null);
      const r = await crearInvitacionEquipo(email, rol);
      if (r.ok) {
        setFormulario(false);
        setEmail("");
        setRol("lectura");
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  };

  const revocar = (id: string) =>
    iniciar(async () => {
      setError(null);
      const r = await revocarInvitacionEquipo(id);
      if (r.ok) router.refresh();
      else setError(r.error);
    });

  return (
    <div className="mt-4">
      <ul className="space-y-1">
        {equipo.map((m) => (
          <li
            key={m.id}
            className="border-ink-700/8 flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0 dark:border-white/8"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {m.email}
                {m.email === miCorreo && (
                  <span className="text-muted ml-1.5 text-xs">(tú)</span>
                )}
              </p>
              <p className="text-muted flex items-center gap-1.5 text-xs">
                <KeyRound className="size-3" aria-hidden />
                {m.mfa ? "segundo factor activo" : "sin segundo factor"} ·
                desde el {formatDate(m.creada)}
              </p>
            </div>
            <Badge tone={TONO_ROL[m.rol as keyof typeof TONO_ROL] ?? "neutral"}>
              {m.rol}
            </Badge>
          </li>
        ))}
      </ul>

      {invitaciones.length > 0 && (
        <div className="mt-4">
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            Invitaciones pendientes
          </p>
          <ul className="mt-2 space-y-1">
            {invitaciones.map((i) => (
              <li
                key={i.id}
                className="border-ink-700/8 flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0 dark:border-white/8"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Mail className="text-muted size-3.5" aria-hidden />
                    {i.email}
                  </p>
                  <p className="text-muted flex items-center gap-1.5 text-xs">
                    <Clock className="size-3" aria-hidden />
                    caduca el {formatDate(i.expiraEn, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={TONO_ROL[i.rol as keyof typeof TONO_ROL] ?? "neutral"}>
                    {i.rol}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pendiente}
                    onClick={() => revocar(i.id)}
                    aria-label={`Revocar invitación a ${i.email}`}
                  >
                    <XCircle className="size-4" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {formulario ? (
        <form
          onSubmit={invitar}
          className="border-ink-700/10 mt-5 space-y-4 border-t pt-5 dark:border-white/10"
        >
          <Field htmlFor="invitar-email" label="Correo de la persona">
            <Input
              id="invitar-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@feanware.com"
            />
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-medium">Rol</p>
            <div className="flex flex-wrap gap-2">
              {(["admin", "soporte", "lectura"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRol(r)}
                  aria-pressed={rol === r}
                  className={
                    rol === r
                      ? "bg-honey-300 text-ink-700 min-h-10 cursor-pointer rounded-full px-4 text-sm font-medium"
                      : "border-ink-700/15 text-muted hover:text-foreground min-h-10 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors duration-200 dark:border-white/15"
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={pendiente}>
              <UserPlus className="size-4" aria-hidden />
              Enviar invitación
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pendiente}
              onClick={() => setFormulario(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className="mt-5"
          onClick={() => setFormulario(true)}
        >
          <Plus className="size-4" aria-hidden />
          Invitar
        </Button>
      )}
    </div>
  );
}
