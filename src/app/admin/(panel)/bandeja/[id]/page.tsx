import Link from "next/link";
import { ArrowLeft, Inbox, StickyNote, MailCheck, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AccionesMensaje } from "./acciones";
import { requerirAdmin } from "@/server/admin-session";
import { CATEGORIAS, obtenerTicket, type Categoria } from "@/server/modules/soporte";
import { registrarLecturaMensaje } from "@/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Mensaje" };

const ESTADO = {
  nuevo: { etiqueta: "Nuevo", tono: "warning" },
  en_curso: { etiqueta: "En curso", tono: "info" },
  resuelto: { etiqueta: "Resuelto", tono: "success" },
} as const;

export default async function MensajePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await requerirAdmin(["admin", "soporte"]);
  const { id } = await params;

  const datos = await obtenerTicket(id);

  if (!datos) {
    return (
      <div>
        <PageHeader eyebrow="Bandeja" title="Mensaje no encontrado" />
        <EmptyState
          flat
          icon={Inbox}
          titulo="No existe ese mensaje"
          descripcion="Puede que el enlace esté mal."
        />
      </div>
    );
  }

  const { ticket, notas } = datos;

  // Leer lo que alguien escribió queda registrado, una vez por ventana.
  await registrarLecturaMensaje(ticket.email);

  const est = ESTADO[ticket.estado as keyof typeof ESTADO] ?? ESTADO.nuevo;
  const urgente = ticket.prioridad === "urgente" && ticket.estado !== "resuelto";

  return (
    <div>
      <Link
        href="/admin/bandeja"
        className="text-muted hover:text-foreground mb-4 flex cursor-pointer items-center gap-1.5 text-sm transition-colors duration-200"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Bandeja
      </Link>

      <PageHeader
        eyebrow={CATEGORIAS[ticket.categoria as Categoria] ?? ticket.categoria}
        title={ticket.email}
        description={`Recibido el ${formatDate(ticket.createdAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`}
        action={
          <div className="flex flex-wrap gap-2">
            {urgente && <Badge tone="danger">Urgente</Badge>}
            <Badge tone={est.tono}>{est.etiqueta}</Badge>
          </div>
        }
      />

      <div className="space-y-4">
        {!ticket.verificado && (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-500/14 p-4">
            <TriangleAlert
              className="mt-0.5 size-5 shrink-0 text-amber-800 dark:text-amber-300"
              aria-hidden
            />
            <p className="text-sm leading-relaxed">
              <strong className="font-medium">El correo no está verificado.</strong>{" "}
              Este mensaje se envió desde la página pública, sin sesión, así que
              cualquiera pudo escribir esa dirección. Si respondes, la respuesta
              irá a <strong>{ticket.email}</strong>; no incluyas nada que no
              quieras que lea quien sea que la reciba.
            </p>
          </div>
        )}

        <Card flat className="p-6">
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {ticket.mensaje}
          </p>
          {ticket.userId && (
            <p className="text-muted border-ink-700/10 mt-5 border-t pt-4 text-xs dark:border-white/10">
              Corresponde a una cuenta.{" "}
              <Link
                href={`/admin/soporte/${ticket.userId}`}
                className="text-accent cursor-pointer underline"
              >
                Ver la cuenta
              </Link>
            </p>
          )}
        </Card>

        {notas.length > 0 && (
          <Card flat className="p-6">
            <h2 className="text-lg">Historial</h2>
            <ul className="mt-4 space-y-4">
              {notas.map((n) => (
                <li key={n.id} className="flex gap-3">
                  {n.tipo === "respuesta" ? (
                    <MailCheck className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
                  ) : (
                    <StickyNote className="text-muted mt-0.5 size-4 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="text-muted text-xs">
                      {n.tipo === "respuesta" ? "Respuesta enviada por " : "Nota interna de "}
                      {n.autor} ·{" "}
                      {formatDate(n.createdAt, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {n.contenido}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card flat className="p-6">
          <AccionesMensaje
            id={ticket.id}
            estado={ticket.estado}
            asignadoA={ticket.asignadoA}
            miCorreo={sesion.email}
            correoDestino={ticket.email}
          />
        </Card>
      </div>
    </div>
  );
}
