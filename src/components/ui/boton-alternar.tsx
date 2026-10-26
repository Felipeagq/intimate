import { Plus, X } from "lucide-react";
import { Button } from "./button";

/**
 * El botón que abre y cierra un formulario en la cabecera de una sección
 * ("Nueva petición" ↔ "Cancelar"). Existe para que todas las secciones lo
 * muestren igual: mismo tamaño, mismas variantes y mismo icono.
 */
export function BotonAlternar({
  abierto,
  onClick,
  etiqueta,
}: {
  abierto: boolean;
  onClick: () => void;
  /** Texto cuando está cerrado: "Nueva", "Nuevo acuerdo"… */
  etiqueta: string;
}) {
  return (
    <Button
      size="sm"
      variant={abierto ? "ghost" : "secondary"}
      onClick={onClick}
      aria-expanded={abierto}
    >
      {abierto ? (
        <>
          <X aria-hidden />
          Cancelar
        </>
      ) : (
        <>
          <Plus aria-hidden />
          {etiqueta}
        </>
      )}
    </Button>
  );
}
