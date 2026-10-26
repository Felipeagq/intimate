/**
 * Prueba el registro de correos fallidos y la pantalla de salud.
 *
 *   pnpm test:sistema
 *
 * El fallo de correo es real pero inofensivo: se usa una clave de SendGrid
 * inválida a propósito, así la petición llega, SendGrid responde 401 y no
 * sale ningún correo. No toca la reputación del remitente.
 *
 * Las variables se alteran ANTES de importar nada, porque `env.ts` las lee
 * una sola vez al cargarse.
 */
process.env.SENDGRID_API_KEY = "SG.clave-invalida-solo-para-la-prueba";
// Una configuración de Google a medias, para comprobar que se detecta.
process.env.GOOGLE_CLIENT_ID = "id-de-prueba";
delete process.env.GOOGLE_CLIENT_SECRET;

const DESTINO = "fallo.sistema@feanware-test.local";

let fallos = 0;
function comprobar(descripcion: string, condicion: boolean) {
  console.log(`  ${condicion ? "OK   " : "FALLA"} ${descripcion}`);
  if (!condicion) fallos++;
}

async function main() {
  const { ilike, eq } = await import("drizzle-orm");
  const { db } = await import("../src/server/db/client");
  const { emailEvents } = await import("../src/server/db/schema-sistema");
  const { enviarEmail, probarSendGrid } = await import("../src/server/email");
  const sistema = await import("../src/server/modules/sistema");

  const limpiar = () =>
    db.delete(emailEvents).where(ilike(emailEvents.para, "%feanware-test.local%"));

  await limpiar();

  console.log("\n— Un correo que falla queda registrado —");
  let lanzo = false;
  try {
    await enviarEmail({
      tipo: "prueba",
      para: DESTINO,
      asunto: "no debería salir",
      texto: "no debería salir",
    });
  } catch {
    lanzo = true;
  }
  comprobar("el envío sigue lanzando el error a quien lo llamó", lanzo);

  const filas = await db
    .select()
    .from(emailEvents)
    .where(eq(emailEvents.para, DESTINO));
  comprobar("queda una fila de fallo", filas.length === 1 && filas[0].estado === "fallido");
  comprobar("con el tipo correcto", filas[0]?.tipo === "prueba");
  comprobar("y el motivo de SendGrid", /401/.test(filas[0]?.error ?? ""));
  comprobar(
    "el motivo no filtra la clave",
    !(filas[0]?.error ?? "").includes("clave-invalida-solo-para-la-prueba"),
  );

  console.log("\n— Resumen y listado —");
  const resumen = await sistema.resumenCorreos(7);
  comprobar("el resumen cuenta el fallo", resumen.fallidos >= 1);
  comprobar(
    "la tasa de entrega es un porcentaje o null",
    resumen.entrega === null || (resumen.entrega >= 0 && resumen.entrega <= 100),
  );
  const lista = await sistema.correosFallidos(30);
  comprobar("el listado incluye el fallo, con su destinatario", lista.some((f) => f.para === DESTINO));
  comprobar("y viene del más reciente al más antiguo", lista.every((f, i) => i === 0 || lista[i - 1].createdAt >= f.createdAt));

  console.log("\n— Comprobación de la clave sin enviar nada —");
  const sg = await probarSendGrid();
  comprobar("detecta una clave inválida", sg.ok === false);
  comprobar("y lo explica", /rechaz|clave/i.test(sg.detalle));

  console.log("\n— Conexiones —");
  const conexiones = await sistema.comprobarConexiones();
  comprobar("devuelve las cuatro", conexiones.length === 4);
  const por = (id: string) => conexiones.find((c) => c.id === id);
  comprobar("la base de datos responde", por("db")?.estado === "ok");
  comprobar("mide el tiempo de la base", typeof por("db")?.ms === "number");
  comprobar("el correo falla con la clave inválida", por("correo")?.estado === "fallo");
  comprobar(
    "cada estado es uno de los tres permitidos",
    conexiones.every((c) => ["ok", "fallo", "sin_configurar"].includes(c.estado)),
  );
  comprobar(
    "ningún detalle contiene la clave",
    !JSON.stringify(conexiones).includes("clave-invalida-solo-para-la-prueba"),
  );

  console.log("\n— Revisión de configuración —");
  const config = sistema.revisarConfiguracion();
  const todas = config.grupos.flatMap((g) => g.variables);
  comprobar("lista las variables por nombre", todas.some((v) => v.nombre === "DATABASE_URL"));
  comprobar(
    "nunca incluye valores, solo si están definidas",
    todas.every((v) => typeof v.definida === "boolean") &&
      !JSON.stringify(config).includes("clave-invalida-solo-para-la-prueba"),
  );
  comprobar(
    "avisa de Google a medias",
    config.avisos.some((a) => a.includes("Google") && a.includes("GOOGLE_CLIENT_SECRET")),
  );

  const entorno = process.env as Record<string, string | undefined>;
  const anterior = entorno.NODE_ENV;
  entorno.NODE_ENV = "production";
  const enProduccion = sistema.revisarConfiguracion();
  entorno.NODE_ENV = anterior;
  comprobar(
    "avisa si en producción los enlaces apuntan a localhost",
    enProduccion.avisos.some((a) => a.includes("localhost")),
  );
  comprobar(
    "y no lo avisa en desarrollo, donde es lo normal",
    !config.avisos.some((a) => a.includes("localhost")),
  );

  await limpiar();
}

main()
  .then(() => {
    console.log(
      fallos === 0
        ? "\nTodas las comprobaciones pasaron.\n"
        : `\n${fallos} comprobaciones fallaron.\n`,
    );
    process.exit(fallos === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error("\nError:", err instanceof Error ? err.message : err, "\n");
    process.exit(1);
  });
