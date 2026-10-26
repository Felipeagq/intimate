import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";

/** Marco de las pantallas de acceso del panel, fuera del shell con menú. */
export function AdminShell({
  children,
  nota,
}: {
  children: React.ReactNode;
  nota?: string;
}) {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <LogoMark className="size-7" />
          <span className="font-display text-lg">Intimate</span>
          <Badge tone="neutral" className="text-[0.6rem]">
            Panel
          </Badge>
        </div>

        {children}

        {nota && (
          <p className="text-muted mt-6 text-center text-xs leading-relaxed">
            {nota}
          </p>
        )}
      </div>
    </main>
  );
}
