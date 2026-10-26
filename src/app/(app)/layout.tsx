import Link from "next/link";
import { Settings, UserPlus } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BottomNav, Sidebar } from "@/components/app-nav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarPareja } from "@/components/ui/avatar";
import { DetectarZona } from "@/components/detectar-zona";
import { contextoApp } from "@/server/session";
import { rachaDePareja } from "@/server/modules/oracion";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await contextoApp();
  const racha = ctx.pareja
    ? await rachaDePareja(ctx.pareja.coupleId, ctx.zona)
    : 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl gap-6 px-3 sm:px-4">
      <aside className="hidden w-60 shrink-0 py-6 lg:block">
        <div className="sticky top-6 space-y-6">
          <Link href="/inicio" className="block cursor-pointer px-2">
            <Logo />
          </Link>
          <Sidebar />

          {ctx.pareja ? (
            <Card className="p-4">
              <AvatarPareja
                unoUrl={ctx.fotoUrl}
                unoNombre={ctx.nombre}
                dosUrl={ctx.parejaFotoUrl}
                dosNombre={ctx.pareja.parejaNombre}
                tamano="sm"
                className="mb-3"
              />
              <p className="text-muted text-xs">Racha de pareja</p>
              <p className="mt-1 font-display text-3xl">
                {racha}
                <span className="text-muted ml-1.5 text-sm">
                  {racha === 1 ? "día" : "días"}
                </span>
              </p>
              <p className="text-muted mt-2 text-xs leading-relaxed">
                {racha === 0
                  ? "Empieza hoy: cuenta los días en que los dos oran."
                  : "Días en que los dos estuvieron."}
              </p>
            </Card>
          ) : (
            <Card className="p-4">
              <UserPlus className="text-accent size-5" aria-hidden />
              <p className="mt-2 text-sm font-medium">Invita a tu pareja</p>
              <p className="text-muted mt-1 text-xs leading-relaxed">
                Mientras tanto, todo lo personal ya funciona.
              </p>
              <Link
                href="/vincular"
                className="text-accent mt-3 inline-block cursor-pointer text-xs font-medium underline"
              >
                Generar código
              </Link>
            </Card>
          )}

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
        <header className="flex items-center justify-between py-4 lg:hidden">
          <Link href="/inicio" className="cursor-pointer">
            <Logo />
          </Link>
          <Link
            href="/ajustes"
            aria-label={`Ajustes de ${ctx.email}`}
            className="flex cursor-pointer items-center"
          >
            {ctx.fotoUrl ? (
              <Avatar url={ctx.fotoUrl} nombre={ctx.nombre} tamano="md" />
            ) : (
              <span className="glass glass-hover flex size-11 items-center justify-center">
                <Settings className="size-5" aria-hidden />
              </span>
            )}
          </Link>
        </header>

        {/* pb-28 reserva el alto de la barra inferior flotante en móvil. */}
        <main className="pb-28 lg:py-6 lg:pb-12">{children}</main>
      </div>

      <BottomNav />
      <DetectarZona confirmada={ctx.zonaConfirmada} />
    </div>
  );
}
