import { Search, Mail, Ban, Trash2, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { requerirAdmin } from "@/server/admin-session";
import { cuentas } from "@/lib/mock-admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Soporte" };

const tonoEstado = {
  activa: "success",
  suspendida: "warning",
  "eliminación pendiente": "danger",
} as const;

export default async function SoportePage() {
  // Rechaza aunque el menú no muestre el enlace.
  await requerirAdmin(["admin", "soporte"]);

  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Soporte"
        description="Busca una cuenta por correo para ayudar a un usuario. Se ve su estado, nunca lo que escribió."
      />

      <Card flat className="mb-4 p-5">
        <label htmlFor="buscar" className="sr-only">
          Buscar cuenta por correo
        </label>
        <div className="relative">
          <Search
            className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            id="buscar"
            type="search"
            placeholder="correo@ejemplo.com"
            className="pl-11"
          />
        </div>
      </Card>

      <Card flat className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Cuentas de usuario</caption>
            <thead className="border-ink-700/10 border-b dark:border-white/10">
              <tr className="text-muted text-left">
                {["Correo", "Estado", "Pareja", "Último acceso", "Creada", ""].map(
                  (h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-5 py-3 font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c) => (
                <tr
                  key={c.id}
                  className="border-ink-700/8 border-b last:border-0 dark:border-white/8"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">{c.email}</p>
                    <p className="text-muted font-mono text-xs">{c.id}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={tonoEstado[c.estado]}>{c.estado}</Badge>
                  </td>
                  <td className="text-muted px-5 py-4 whitespace-nowrap">
                    {c.pareja}
                  </td>
                  <td className="text-muted px-5 py-4 whitespace-nowrap">
                    {formatDate(c.ultimoAcceso)}
                  </td>
                  <td className="text-muted px-5 py-4 whitespace-nowrap">
                    {formatDate(c.creada)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Reenviar acceso a ${c.email}`}
                      >
                        <Mail className="size-4" aria-hidden />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Suspender ${c.email}`}
                      >
                        <Ban className="size-4" aria-hidden />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Eliminar ${c.email}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card flat className="mt-4 flex items-start gap-3 p-5">
        <EyeOff className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="text-muted text-sm leading-relaxed">
          <p>
            Un usuario con rol <strong className="text-foreground">lectura</strong>{" "}
            recibe 403 al intentar suspender una cuenta, aunque llame
            directamente a la Server Action: el rol se verifica en el caso de
            uso, no solo en el middleware.
          </p>
          <p className="mt-2">
            Cada acción de esta pantalla genera un evento de auditoría.
          </p>
        </div>
      </Card>
    </div>
  );
}
