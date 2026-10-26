import { CloudOff } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Card className="max-w-md p-10 text-center">
        <LogoMark className="text-accent mx-auto size-10" />
        <CloudOff className="text-muted mx-auto mt-6 size-7" aria-hidden />
        <h1 className="mt-4 text-2xl">Sin conexión</h1>
        <p className="text-muted mt-3 leading-relaxed">
          No pudimos cargar esta pantalla. Lo que estabas escribiendo se guardó
          en tu dispositivo y se enviará cuando vuelva la señal.
        </p>
      </Card>
    </main>
  );
}
