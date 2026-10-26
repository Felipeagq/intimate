"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { adminClient } from "@/lib/auth-admin-client";

export function CerrarSesionAdmin() {
  const [cargando, setCargando] = useState(false);

  return (
    <button
      type="button"
      disabled={cargando}
      onClick={async () => {
        setCargando(true);
        await adminClient.signOut();
        window.location.href = "/admin/entrar";
      }}
      className="text-muted hover:text-foreground mt-3 flex min-h-11 w-full cursor-pointer items-center gap-2 text-xs transition-colors duration-200 disabled:opacity-55"
    >
      <LogOut className="size-3.5" aria-hidden />
      {cargando ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
