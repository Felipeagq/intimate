"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function CerrarSesion() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  return (
    <Button
      variant="ghost"
      className="w-full"
      loading={cargando}
      onClick={async () => {
        setCargando(true);
        await authClient.signOut();
        router.push("/entrar");
        router.refresh();
      }}
    >
      <LogOut className="size-4" aria-hidden />
      Cerrar sesión
    </Button>
  );
}
