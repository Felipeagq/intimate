/**
 * Prueba de integración contra la base real.
 *
 *   pnpm test:integracion
 *
 * Crea dos usuarios de prueba, los vincula, ejercita cada módulo y comprueba
 * las reglas que el documento considera no negociables: que la respuesta del
 * otro no se revele antes de tiempo, que un acuerdo necesite dos
 * confirmaciones, que la racha cuente los días en que ambos oraron y que
 * nadie pueda tocar el espacio de una pareja ajena.
 *
 * Borra todo lo que crea al terminar, incluso si una comprobación falla.
 */
import { eq, ilike, inArray } from "drizzle-orm";
import { auth } from "../src/server/auth";
import { db } from "../src/server/db/client";
import { user } from "../src/server/db/schema";
import { couples } from "../src/server/db/schema-app";
import { auditEvents } from "../src/server/db/schema-audit";
import * as pareja from "../src/server/modules/pareja";
import * as oracion from "../src/server/modules/oracion";
import * as devocional from "../src/server/modules/devocional";
import * as promesas from "../src/server/modules/promesas";
import * as acuerdos from "../src/server/modules/acuerdos";
import * as checkin from "../src/server/modules/checkin";
import * as admin from "../src/server/modules/admin";
import * as auditoria from "../src/server/modules/auditoria";
import { calcularRacha, fechaLocal } from "../src/server/modules/fecha";
import { desfaseDe, esZonaValida, listarZonas } from "../src/server/modules/zona";
import {
  LIBROS,
  formatearReferencia,
  interpretarReferencia,
} from "../src/server/modules/referencia-biblica";

const ZONA = "America/Bogota";
const CORREOS = [
  "ana.integracion@ejemplo-intimate.test",
  "beto.integracion@ejemplo-intimate.test",
];

let fallos = 0;

function comprobar(descripcion: string, condicion: boolean) {
  console.log(`  ${condicion ? "OK   " : "FALLA"} ${descripcion}`);
  if (!condicion) fallos++;
}

async function crearUsuario(email: string) {
  const ctx = await auth.$context;
  return ctx.internalAdapter.createUser(
    { email, name: email.split(".")[0], emailVerified: true },
    { method: "prueba-integracion" },
  );
}

async function limpiar() {
  // El evento de auditoría de prueba no cae por cascada desde el usuario:
  // vive en una tabla aparte y sin relación declarada.
  for (const correo of CORREOS) {
    await db.delete(auditEvents).where(ilike(auditEvents.objetivo, `%${correo}%`));
  }

  const existentes = await db
    .select({ id: user.id })
    .from(user)
    .where(inArray(user.email, CORREOS));

  if (existentes.length === 0) return;
  const ids = existentes.map((u) => u.id);

  // Las parejas no caen por cascada desde el usuario en los dos sentidos,
  // así que se borran antes.
  const suyas = await db.select({ id: couples.id }).from(couples);
  for (const c of suyas) {
    const fila = await db.query.couples.findFirst({ where: eq(couples.id, c.id) });
    if (fila && (ids.includes(fila.miembroA) || ids.includes(fila.miembroB))) {
      await db.delete(couples).where(eq(couples.id, c.id));
    }
  }
  await db.delete(user).where(inArray(user.id, ids));
}

async function main() {
  await limpiar();

  console.log("\n— Cálculo de rachas (sin tocar la base) —");
  comprobar(
    "tres días seguidos dan racha 3",
    calcularRacha(["2026-10-23", "2026-10-24", "2026-10-25"], "2026-10-25")
      .actual === 3,
  );
  comprobar(
    "un hueco se perdona con el día de gracia",
    calcularRacha(
      ["2026-10-21", "2026-10-22", "2026-10-24", "2026-10-25"],
      "2026-10-25",
    ).actual === 4,
  );
  comprobar(
    "dos huecos en la misma semana sí rompen la racha",
    calcularRacha(["2026-10-19", "2026-10-21", "2026-10-23", "2026-10-25"], "2026-10-25")
      .actual < 4,
  );
  comprobar(
    "sin registros la racha es 0",
    calcularRacha([], "2026-10-25").actual === 0,
  );

  console.log("\n— Zonas horarias —");
  comprobar("acepta una zona real", esZonaValida("America/Bogota") && esZonaValida("Europe/Madrid"));
  comprobar(
    "rechaza zonas inventadas, vacías o enormes",
    !esZonaValida("Marte/Olympus") && !esZonaValida("") && !esZonaValida("x".repeat(200)),
  );
  comprobar("rechaza lo que no es texto", !esZonaValida(42) && !esZonaValida(null));
  comprobar("el selector ofrece UTC y Bogotá", listarZonas().includes("UTC") && listarZonas().includes("America/Bogota"));
  comprobar("y cientos de zonas más", listarZonas().length > 300);
  comprobar("el desfase de Bogotá es UTC-5", desfaseDe("America/Bogota") === "UTC-5");

  // 03:30 UTC del día 26 todavía es la noche del 25 en Colombia.
  const instante = new Date("2026-10-26T03:30:00Z");
  comprobar(
    "el mismo instante es otro día según la zona",
    fechaLocal("America/Bogota", instante) === "2026-10-25" &&
      fechaLocal("Asia/Tokyo", instante) === "2026-10-26",
  );
  // Criterio del documento: orar a las 23:50 cuenta para ese día aunque
  // el servidor ya esté en el siguiente.
  comprobar(
    "orar a las 23:50 en Bogotá cuenta para ese día, no para el siguiente",
    fechaLocal("America/Bogota", new Date("2026-10-26T04:50:00Z")) === "2026-10-25",
  );

  console.log("\n— Citas bíblicas —");
  const cita = (texto: string) => {
    const r = interpretarReferencia(texto);
    return r.ok ? formatearReferencia(r.referencia) : null;
  };
  const casos: [string, string][] = [
    ["Juan 3:16", "Juan 3:16"],
    ["jn 3:16-18", "Juan 3:16-18"],
    ["  JUAN   3 : 16  ", "Juan 3:16"],
    ["Salmo 23", "Salmos 23"],
    ["Sal 119:105", "Salmos 119:105"],
    ["Ro. 8.28", "Romanos 8:28"],
    ["Ro 8,28-30", "Romanos 8:28-30"],
    ["Isaías 53:5", "Isaías 53:5"],
    ["Is 41:10", "Isaías 41:10"],
    ["1 Corintios 13:4-7", "1 Corintios 13:4-7"],
    ["1Co 13", "1 Corintios 13"],
    ["I Corintios 13", "1 Corintios 13"],
    ["Primera de Juan 1", "1 Juan 1"],
    ["II Pedro 1:3", "2 Pedro 1:3"],
    ["2 Timoteo 3:16", "2 Timoteo 3:16"],
    ["Filipenses 4:13", "Filipenses 4:13"],
    ["Filemón 1:6", "Filemón 1:6"],
    ["Cantar de los Cantares 2:4", "Cantares 2:4"],
    ["Apocalipsis 21:4", "Apocalipsis 21:4"],
    ["Génesis 1:1", "Génesis 1:1"],
    ["genesis 1:1", "Génesis 1:1"],
  ];
  for (const [entrada, esperado] of casos) {
    comprobar(`"${entrada.trim()}" → ${esperado}`, cita(entrada) === esperado);
  }
  const rechazadas = [
    "", "   ", "Foo 3:16", "Juan", "Juan 0:1", "Juan 3:0",
    "Juan 3:18-16", "Juan 3:16-4:2", "3:16", "x".repeat(200),
  ];
  for (const entrada of rechazadas) {
    comprobar(
      `rechaza "${entrada.slice(0, 24).trim()}${entrada.length > 24 ? "…" : ""}"`,
      cita(entrada) === null,
    );
  }
  comprobar("la lista tiene los 66 libros", LIBROS.length === 66);
  comprobar(
    "numerados del 1 al 66 sin saltos ni repetidos",
    LIBROS.every((l, i) => l.nr === i + 1),
  );
  comprobar(
    "ningún alias se repite entre libros distintos",
    (() => {
      const vistos = new Map<string, number>();
      for (const l of LIBROS) {
        for (const a of l.alias) {
          if (vistos.has(a) && vistos.get(a) !== l.nr) return false;
          vistos.set(a, l.nr);
        }
      }
      return true;
    })(),
  );

  console.log("\n— Vinculación de pareja —");
  const ana = await crearUsuario(CORREOS[0]);
  const beto = await crearUsuario(CORREOS[1]);

  const { codigo } = await pareja.crearInvitacion(ana.id);
  comprobar("el código tiene 6 caracteres", codigo.length === 6);

  let rechazado = false;
  try {
    await pareja.aceptarInvitacion(beto.id, "ZZZZZZ");
  } catch {
    rechazado = true;
  }
  comprobar("un código inventado se rechaza", rechazado);

  await pareja.aceptarInvitacion(beto.id, codigo);
  const vinculo = await pareja.obtenerPareja(ana.id, ZONA);
  comprobar("quedan vinculados", vinculo !== null);
  comprobar("Ana ve a Beto como su pareja", vinculo?.parejaId === beto.id);

  let reutilizado = false;
  try {
    await pareja.aceptarInvitacion(beto.id, codigo);
  } catch {
    reutilizado = true;
  }
  comprobar("el mismo código no sirve dos veces", reutilizado);

  const coupleId = vinculo!.coupleId;

  console.log("\n— Aislamiento entre parejas —");
  const intruso = await crearUsuario("intruso@ejemplo-intimate.test");
  let bloqueado = false;
  try {
    await acuerdos.listarAcuerdos(intruso.id, coupleId);
  } catch {
    bloqueado = true;
  }
  comprobar("un tercero no puede leer los acuerdos de la pareja", bloqueado);
  await db.delete(user).where(eq(user.id, intruso.id));

  console.log("\n— Devocional en pareja —");
  const dev = await devocional.crearDevocionalDePareja(ana.id, coupleId, ZONA, {
    pasaje: "Eclesiastés 4:9-12",
    titulo: "Cordón de tres dobleces",
  });

  await devocional.guardarRespuesta(ana.id, dev.id, "Lo que Dios me dijo a mí.", ZONA);

  let vista = await devocional.devocionalDeParejaHoy(ana.id, coupleId, beto.id, ZONA);
  comprobar("Ana ya respondió", vista?.yoRespondi === true);
  comprobar("Beto todavía no", vista?.parejaRespondio === false);
  comprobar(
    "la respuesta del otro NO sale del servidor antes de tiempo",
    vista?.respuestaPareja === null,
  );

  await devocional.guardarRespuesta(beto.id, dev.id, "Lo que Dios me dijo a mí también.", ZONA);
  vista = await devocional.devocionalDeParejaHoy(ana.id, coupleId, beto.id, ZONA);
  comprobar("con los dos, se revela", vista?.revelado === true);
  comprobar(
    "y ahora sí llega el texto del otro",
    vista?.respuestaPareja?.includes("también") === true,
  );

  console.log("\n— Oración y racha de pareja —");
  const metricas = await oracion.obtenerMetricas(ana.id, ZONA);
  comprobar(
    "el devocional contó como oración de hoy",
    metricas.hoyRegistrado === true,
  );
  comprobar("la racha personal arranca en 1", metricas.racha === 1);

  const rachaPareja = await oracion.rachaDePareja(coupleId, ZONA);
  comprobar("la racha de pareja es 1: los dos oraron", rachaPareja === 1);

  console.log("\n— Promesas —");
  await promesas.crearPromesa(ana.id, {
    cita: "Jeremías 29:11",
    texto: "Pensamientos de paz y no de mal.",
    contexto: "Prueba",
  });
  const delDia = await promesas.promesaDelDia(ana.id, ZONA);
  comprobar("hay promesa del día", delDia?.cita === "Jeremías 29:11");
  const otraVez = await promesas.promesaDelDia(ana.id, ZONA);
  comprobar("el mismo día devuelve la misma", otraVez?.id === delDia?.id);

  console.log("\n— Acuerdos —");
  const acuerdo = await acuerdos.crearAcuerdo(ana.id, coupleId, {
    titulo: "Devocional tres veces por semana",
  });
  let lista = await acuerdos.listarAcuerdos(ana.id, coupleId);
  comprobar("nace en revisión, no vigente", lista[0]?.estado === "en revisión");
  comprobar("quien lo propone ya lo confirmó", lista[0]?.confirmadoPorMi === true);

  await acuerdos.confirmarAcuerdo(beto.id, coupleId, acuerdo.id);
  lista = await acuerdos.listarAcuerdos(ana.id, coupleId);
  comprobar("con las dos confirmaciones pasa a vigente", lista[0]?.estado === "vigente");

  console.log("\n— Check-in semanal —");
  await checkin.responderCheckin(ana.id, coupleId, ZONA, ["a", "b", "c"]);
  let sem = await checkin.checkinDeLaSemana(ana.id, coupleId, beto.id, ZONA);
  comprobar(
    "lo del otro sigue oculto con una sola respuesta",
    sem.respuestasPareja === null,
  );
  await checkin.responderCheckin(beto.id, coupleId, ZONA, ["x", "y", "z"]);
  sem = await checkin.checkinDeLaSemana(ana.id, coupleId, beto.id, ZONA);
  comprobar("con los dos, se revela", sem.revelado === true);

  console.log("\n— Panel: métricas reales —");
  const m = await admin.obtenerMetricas();
  comprobar("cuenta la pareja activa", m.parejasActivas.valor >= 1);
  comprobar("cuenta los devocionales de la semana", m.devocionalesSemana.valor >= 1);
  comprobar("cuenta la invitación aceptada", m.aceptacionInvitacion.valor > 0);

  const cuentas = await admin.buscarCuentas("integracion");
  comprobar("soporte encuentra las cuentas por correo", cuentas.length === 2);
  comprobar(
    "y las ve como vinculadas",
    cuentas.every((c) => c.pareja === "vinculada"),
  );
  comprobar(
    "ninguna consulta del panel devuelve contenido",
    !JSON.stringify(cuentas).includes("Dios me dijo"),
  );

  console.log("\n— Panel: seguimiento del producto —");
  const rachas = await admin.distribucionDeRachas();
  comprobar("la distribución tiene los seis tramos", rachas.length === 6);
  comprobar(
    "la pareja de prueba cae en el tramo de 1 a 3 días",
    (rachas.find((b) => b.bucket === "1-3")?.parejas ?? 0) >= 1,
  );

  const embudo = await admin.embudoActivacion();
  comprobar("el embudo tiene cinco pasos", embudo.length === 5);
  comprobar(
    "cuenta que la invitación fue aceptada",
    (embudo.find((p) => p.paso === "La pareja aceptó")?.valor ?? 0) >= 1,
  );
  comprobar(
    "cuenta el primer devocional juntos",
    (embudo.find((p) => p.paso === "Primer devocional juntos")?.valor ?? 0) >= 1,
  );

  const modulos = await admin.desgloseModulos();
  const mod = (nombre: string) =>
    modulos.find((m) => m.modulo === nombre)?.estaSemana ?? 0;
  comprobar("el desglose cubre los siete módulos", modulos.length === 7);
  comprobar("cuenta el devocional de pareja", mod("Devocional de pareja") >= 1);
  comprobar("cuenta las promesas", mod("Promesas guardadas") >= 1);
  comprobar("cuenta los acuerdos", mod("Acuerdos propuestos") >= 1);
  comprobar("cuenta los dos check-ins", mod("Check-ins respondidos") >= 2);
  comprobar(
    "el devocional personal no se mezcla con el de pareja",
    mod("Devocional personal") === 0 || mod("Devocional personal") !== mod("Devocional de pareja"),
  );

  const cohortes = await admin.retencionPorCohorte();
  comprobar("la tabla de cohortes tiene ocho filas", cohortes.length === 8);
  comprobar(
    "cada fila trae cuatro semanas",
    cohortes.every((c) => c.semanas.length === 4),
  );
  comprobar(
    "los porcentajes están entre 0 y 100, o son null si aún no hay dato",
    cohortes.every((c) =>
      c.semanas.every((s) => s === null || (s >= 0 && s <= 100)),
    ),
  );

  console.log("\n— Detalle de cuenta (soporte) —");
  const detalleAna = await admin.obtenerDetalleCuenta(ana.id);
  comprobar("el detalle existe", detalleAna !== null);
  comprobar(
    "muestra la pareja activa con el correo correcto",
    detalleAna?.pareja?.estado === "activa" &&
      detalleAna.pareja.email === beto.email,
  );
  comprobar(
    "sin archivar todavía, archivadaEn es null",
    detalleAna?.pareja?.archivadaEn === null,
  );

  await auditoria.registrarEvento({
    actor: "prueba@feanware.com",
    rol: "soporte",
    accion: "cuenta.consultar",
    objetivo: ana.email,
  });
  const eventosAna = await auditoria.eventosDeCuenta(ana.email);
  comprobar(
    "el filtro de auditoría encuentra el evento por correo",
    eventosAna.some((e) => e.accion === "cuenta.consultar"),
  );
  const eventosBeto = await auditoria.eventosDeCuenta(beto.email);
  comprobar(
    "y no mezcla eventos de otra cuenta",
    !eventosBeto.some((e) => e.accion === "cuenta.consultar"),
  );

  console.log("\n— Desvinculación —");
  await pareja.desvincular(ana.id);
  comprobar(
    "después de salir, ya no hay pareja activa",
    (await pareja.obtenerPareja(ana.id, ZONA)) === null,
  );
  let sinAcceso = false;
  try {
    await acuerdos.listarAcuerdos(ana.id, coupleId);
  } catch {
    sinAcceso = true;
  }
  comprobar("y el espacio compartido deja de ser accesible", sinAcceso);

  const detalleTrasSalir = await admin.obtenerDetalleCuenta(ana.id);
  comprobar(
    "el detalle sigue mostrando con quién estuvo, ahora archivada",
    detalleTrasSalir?.pareja?.estado === "archivada" &&
      detalleTrasSalir.pareja.email === beto.email &&
      detalleTrasSalir.pareja.archivadaEn !== null,
  );
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
