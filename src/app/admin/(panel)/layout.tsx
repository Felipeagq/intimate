import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { CerrarSesionAdmin } from "@/components/cerrar-sesion-admin";
import { requerirAdmin } from "@/server/admin-session";

const tonoRol = { admin: "honey", soporte: "info", lectura: "neutral" } as const;

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificación real: sesión válida, segundo factor activo y rol conocido.
  const sesion = await requerirAdmin();

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl gap-6 px-3 sm:px-4">
      <aside className="hidden w-60 shrink-0 py-6 md:block">
        <div className="sticky top-6 space-y-6">
          <Link
            href="/admin"
            className="flex cursor-pointer items-center gap-2.5 px-2"
          >
            <LogoMark className="size-7" />
            <span className="font-display text-lg">Intimate</span>
            <Badge tone="neutral" className="text-[0.6rem]">
              Panel
            </Badge>
          </Link>

          <AdminNav rol={sesion.rol} />

          <div className="panel p-4">
            <p className="text-muted text-xs">Sesión</p>
            <p className="mt-1 truncate text-sm font-medium">{sesion.email}</p>
            <Badge tone={tonoRol[sesion.rol]} className="mt-2">
              {sesion.rol}
            </Badge>
            <CerrarSesionAdmin />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 py-6">
        <div className="mb-4 md:hidden">
          <AdminNav rol={sesion.rol} horizontal />
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
