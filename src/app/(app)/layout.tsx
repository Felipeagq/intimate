import Link from "next/link";
import { Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BottomNav, Sidebar } from "@/components/app-nav";
import { Card } from "@/components/ui/card";
import { pareja, usuario } from "@/lib/mock-data";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl gap-6 px-3 sm:px-4">
      {/* Columna fija en escritorio */}
      <aside className="hidden w-60 shrink-0 py-6 lg:block">
        <div className="sticky top-6 space-y-6">
          <Link href="/inicio" className="block cursor-pointer px-2">
            <Logo />
          </Link>
          <Sidebar />
          <Card className="p-4">
            <p className="text-muted text-xs">Racha de pareja</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl">
              {pareja.rachaPareja}
              <span className="text-muted ml-1.5 text-sm">días</span>
            </p>
            <p className="text-muted mt-2 text-xs leading-relaxed">
              Días en que los dos estuvieron.
            </p>
          </Card>
          <Link
            href="/ajustes"
            className="text-muted hover:text-foreground flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-colors duration-200"
          >
            <Settings className="size-5" aria-hidden />
            Ajustes
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Cabecera solo en móvil; en escritorio la identidad vive en la barra lateral. */}
        <header className="flex items-center justify-between py-4 lg:hidden">
          <Link href="/inicio" className="cursor-pointer">
            <Logo />
          </Link>
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            className="glass glass-hover flex size-11 cursor-pointer items-center justify-center"
          >
            <Settings className="size-5" aria-hidden />
          </Link>
        </header>

        {/* pb-28 reserva el alto de la barra inferior flotante en móvil. */}
        <main className="pb-28 lg:py-6 lg:pb-12">{children}</main>
      </div>

      <BottomNav />
      <span className="sr-only">Sesión de {usuario.nombre}</span>
    </div>
  );
}
