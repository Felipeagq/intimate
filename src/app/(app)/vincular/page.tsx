import { redirect } from "next/navigation";
import { VincularView } from "./vincular-view";
import { contextoApp } from "@/server/session";
import { invitacionVigente } from "@/server/modules/pareja";

export const metadata = { title: "Invitar a tu pareja" };

export default async function VincularPage() {
  const ctx = await contextoApp();
  if (ctx.pareja) redirect("/pareja");

  const vigente = await invitacionVigente(ctx.userId);

  return (
    <VincularView
      // El código en claro nunca se guarda: si ya hay una invitación viva,
      // solo sabemos que existe y cuándo caduca, no cuál es.
      yaHayInvitacion={Boolean(vigente)}
      expiraEn={vigente?.expiraEn.toISOString() ?? null}
    />
  );
}
