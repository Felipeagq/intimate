/**
 * Prueba la bandeja de soporte contra la base real.
 *
 *   pnpm test:soporte
 *
 * Corre con CORREO_DESACTIVADO=1: no sale ningún correo, ni a la gente de
 * prueba ni al equipo. Limpia todo lo que crea.
 */
import { eq, ilike } from "drizzle-orm";
import { auth } from "../src/server/auth";
import { db } from "../src/server/db/client";
import { user } from "../src/server/db/schema";
import { supportNotes, supportTickets } from "../src/server/db/schema-soporte";
import * as soporte from "../src/server/modules/soporte";

const CUENTA = "cuenta.soporte@feanware-test.local";
const SUELTO = "suelto.soporte@feanware-test.local";
const RAFAGA = "rafaga.soporte@feanware-test.local";
const MENSAJE = "Necesito ayuda con algo que me pasó en la app.";

let fallos = 0;
function comprobar(descripcion: string, condicion: boolean) {
  console.log(`  ${condicion ? "OK   " : "FALLA"} ${descripcion}`);
  if (!condicion) fallos++;
}

async function falla(fn: () => Promise<unknown>) {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}

async function limpiar() {
  // Las notas caen por cascada al borrar el mensaje.
  await db.delete(supportTickets).where(ilike(supportTickets.email, "%feanware-test.local%"));
  await db.delete(user).where(ilike(user.email, "%feanware-test.local%"));
}

async function main() {
  await limpiar();

  const ctx = await auth.$context;
  const cuenta = await ctx.internalAdapter.createUser(
    { email: CUENTA, name: "Cuenta de prueba", emailVerified: true },
    { method: "prueba-soporte" },
  );

  console.log("\n— Crear mensajes —");
  const normal = await soporte.crearTicket({
    email: CUENTA,
    categoria: "ayuda",
    mensaje: MENSAJE,
    verificado: true,
    userId: cuenta.id,
  });
  const t1 = (await soporte.obtenerTicket(normal.id))!.ticket;
  comprobar("queda como nuevo y normal", t1.estado === "nuevo" && t1.prioridad === "normal");
  comprobar("desde una sesión, queda verificado", t1.verificado === true);
  comprobar("y enlazado a su cuenta", t1.userId === cuenta.id);

  const urgente = await soporte.crearTicket({
    email: SUELTO,
    categoria: "reporte_abuso",
    mensaje: "Algo me preocupa de mi relación y no sé a quién decírselo.",
    verificado: false,
  });
  const t2 = (await soporte.obtenerTicket(urgente.id))!.ticket;
  comprobar("un reporte de abuso es urgente", t2.prioridad === "urgente");
  comprobar("desde la página pública, no queda verificado", t2.verificado === false);
  comprobar("un correo sin cuenta no se enlaza a nadie", t2.userId === null);

  const publicoConCuenta = await soporte.crearTicket({
    email: CUENTA.toUpperCase(),
    categoria: "otro",
    mensaje: "Escribo sin haber entrado a mi cuenta todavía.",
    verificado: false,
  });
  const t3 = (await soporte.obtenerTicket(publicoConCuenta.id))!.ticket;
  comprobar("el correo se guarda en minúsculas", t3.email === CUENTA);
  comprobar("si coincide con una cuenta, se enlaza para ayudar a soporte", t3.userId === cuenta.id);
  comprobar("pero sigue sin estar verificado", t3.verificado === false);

  console.log("\n— Validaciones —");
  comprobar("rechaza un mensaje demasiado corto", await falla(() =>
    soporte.crearTicket({ email: SUELTO, categoria: "ayuda", mensaje: "hola", verificado: false })));
  comprobar("rechaza un mensaje enorme", await falla(() =>
    soporte.crearTicket({ email: SUELTO, categoria: "ayuda", mensaje: "x".repeat(4001), verificado: false })));
  comprobar("rechaza un correo inválido", await falla(() =>
    soporte.crearTicket({ email: "no-es-un-correo", categoria: "ayuda", mensaje: MENSAJE, verificado: false })));
  comprobar("rechaza una categoría inventada", await falla(() =>
    soporte.crearTicket({ email: SUELTO, categoria: "hackear", mensaje: MENSAJE, verificado: false })));

  console.log("\n— Límite de frecuencia —");
  for (let i = 0; i < 3; i++) {
    await soporte.crearTicket({
      email: RAFAGA,
      categoria: "ayuda",
      mensaje: `Mensaje número ${i + 1} de la ráfaga de prueba.`,
      verificado: false,
    });
  }
  comprobar("el cuarto mensaje del día desde un mismo correo se frena", await falla(() =>
    soporte.crearTicket({ email: RAFAGA, categoria: "ayuda", mensaje: MENSAJE, verificado: false })));
  comprobar("pero otro correo no se ve afectado", !(await falla(() =>
    soporte.crearTicket({ email: "otro.soporte@feanware-test.local", categoria: "ayuda", mensaje: MENSAJE, verificado: false }))));

  console.log("\n— Lectura —");
  const abiertos = await soporte.listarTickets("abiertos");
  const idxUrgente = abiertos.findIndex((t) => t.id === urgente.id);
  const idxNormal = abiertos.findIndex((t) => t.id === normal.id);
  comprobar("los abiertos incluyen ambos", idxUrgente >= 0 && idxNormal >= 0);
  comprobar("el urgente va antes que el normal, aunque sea más viejo en la lista", idxUrgente < idxNormal);

  const pendientes = await soporte.contarPendientes();
  comprobar("cuenta los nuevos", pendientes.nuevos >= 4);
  comprobar("y los urgentes sin resolver", pendientes.urgentes >= 1);

  comprobar("un id que no es uuid devuelve nada, sin error de base", (await soporte.obtenerTicket("no-es-uuid")) === null);
  comprobar("un uuid inexistente también", (await soporte.obtenerTicket("00000000-0000-4000-8000-000000000000")) === null);

  console.log("\n— Trabajarlo —");
  await soporte.asignarTicket(normal.id, "info@feanware.com");
  let t = (await soporte.obtenerTicket(normal.id))!.ticket;
  comprobar("asignarlo lo pasa a en curso", t.estado === "en_curso" && t.asignadoA === "info@feanware.com");

  await soporte.agregarNota(normal.id, "info@feanware.com", "Parece un problema de zona horaria.");
  const conNota = (await soporte.obtenerTicket(normal.id))!;
  comprobar("la nota queda como interna", conNota.notas.some((n) => n.tipo === "nota"));

  const antesDeResponder = conNota.notas.length;
  const respondido = await soporte.responderTicket(urgente.id, "info@feanware.com", "Gracias por escribirnos. Estamos contigo.");
  comprobar("responder devuelve el correo al que se escribió", respondido.email === SUELTO);
  const trasResponder = (await soporte.obtenerTicket(urgente.id))!;
  comprobar("la respuesta queda guardada como respuesta", trasResponder.notas.some((n) => n.tipo === "respuesta"));
  comprobar("responder a uno nuevo lo pasa a en curso", trasResponder.ticket.estado === "en_curso");
  comprobar("no mezcla notas entre mensajes", antesDeResponder === 1 && trasResponder.notas.length === 1);

  await soporte.cambiarEstadoTicket(normal.id, "resuelto");
  t = (await soporte.obtenerTicket(normal.id))!.ticket;
  comprobar("resolverlo guarda la fecha", t.estado === "resuelto" && t.resueltoEn !== null);
  comprobar("ya no aparece entre los abiertos", !(await soporte.listarTickets("abiertos")).some((x) => x.id === normal.id));
  comprobar("pero sí entre los resueltos", (await soporte.listarTickets("resuelto")).some((x) => x.id === normal.id));

  await soporte.cambiarEstadoTicket(normal.id, "en_curso");
  t = (await soporte.obtenerTicket(normal.id))!.ticket;
  comprobar("reabrirlo borra la fecha de resolución", t.estado === "en_curso" && t.resueltoEn === null);

  comprobar("actuar sobre un id inexistente falla", await falla(() => soporte.cambiarEstadoTicket("00000000-0000-4000-8000-000000000000", "resuelto")));
  comprobar("responder con el texto vacío falla", await falla(() => soporte.responderTicket(normal.id, "x", "   ")));
  comprobar("una nota vacía falla", await falla(() => soporte.agregarNota(normal.id, "x", "")));

  console.log("\n— Si se borra la cuenta —");
  await db.delete(user).where(eq(user.id, cuenta.id));
  const huerfano = (await soporte.obtenerTicket(normal.id))!.ticket;
  comprobar("el mensaje se conserva, sin el vínculo a la cuenta", huerfano.userId === null && huerfano.email === CUENTA);

  const notasAntes = await db.select().from(supportNotes).where(eq(supportNotes.ticketId, normal.id));
  await db.delete(supportTickets).where(eq(supportTickets.id, normal.id));
  const notasDespues = await db.select().from(supportNotes).where(eq(supportNotes.ticketId, normal.id));
  comprobar("borrar un mensaje borra sus notas", notasAntes.length > 0 && notasDespues.length === 0);
}

main()
  .then(async () => {
    await limpiar();
    console.log(
      fallos === 0
        ? "\nTodas las comprobaciones pasaron.\n"
        : `\n${fallos} comprobaciones fallaron.\n`,
    );
    process.exit(fallos === 0 ? 0 : 1);
  })
  .catch(async (err) => {
    await limpiar().catch(() => {});
    console.error("\nError:", err instanceof Error ? err.message : err, "\n");
    process.exit(1);
  });
