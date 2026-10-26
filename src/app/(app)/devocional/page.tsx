import { DevocionalView } from "./devocional-view";
import { contextoApp } from "@/server/session";
import { formatDate } from "@/lib/utils";
import {
  devocionalDeParejaHoy,
  devocionalPersonalAbierto,
} from "@/server/modules/devocional";

export const metadata = { title: "Devocional" };

export default async function DevocionalPage() {
  const ctx = await contextoApp();

  const pareja = ctx.pareja
    ? await devocionalDeParejaHoy(
        ctx.userId,
        ctx.pareja.coupleId,
        ctx.pareja.parejaId,
        ctx.zona,
      )
    : null;

  const personal = await devocionalPersonalAbierto(ctx.userId, ctx.zona);

  return (
    <DevocionalView
      tienePareja={Boolean(ctx.pareja)}
      nombrePareja={ctx.pareja?.parejaNombre ?? null}
      miNombre={ctx.nombre}
      devocionalPareja={pareja}
      fecha={formatDate(new Date(), {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: ctx.zona,
      })}
      personal={
        personal
          ? {
              id: personal.id,
              pasaje: personal.pasaje,
              textoPasaje: personal.textoPasaje,
              observacion: personal.observacion,
              aplicacion: personal.aplicacion,
              oracion: personal.oracion,
              completado: personal.completado,
            }
          : null
      }
    />
  );
}
