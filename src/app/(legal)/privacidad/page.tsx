export const metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl">Política de privacidad</h1>
      <p className="text-muted text-sm">Última actualización: 25 de octubre de 2026</p>

      <h2>Qué guardamos</h2>
      <p>
        Datos de tu cuenta (correo, nombre y zona horaria) y el contenido que tú
        escribes: devocionales, promesas, peticiones de oración, acuerdos y
        afirmaciones.
      </p>

      <h2>Quién puede leer lo que escribes</h2>
      <ul>
        <li>Tú, siempre.</li>
        <li>
          Tu pareja, solo el contenido que marcas como compartido o que
          pertenece al espacio de pareja.
        </li>
        <li>
          Nadie de nuestro equipo. El panel de administración no puede mostrar
          lo que escribes en la app.
        </li>
        <li>
          La única excepción son los mensajes que tú mismo le envías al equipo
          de soporte, desde Ajustes o desde la página de ayuda. Esos sí los
          leemos, porque es la forma de poder ayudarte. Nunca les adjuntamos
          nada de lo que hayas escrito en la app.
        </li>
      </ul>

      <h2>Qué hacemos con la analítica</h2>
      <p>
        Registramos eventos como “completó un devocional”, nunca el contenido de
        lo que escribiste.
      </p>

      <h2>Cuando una pareja se desvincula</h2>
      <p>
        Cada quien conserva una copia de lo que escribió. El espacio compartido
        se archiva y deja de ser accesible para ambos.
      </p>

      <h2>Tus derechos</h2>
      <ul>
        <li>Exportar todos tus datos desde Ajustes.</li>
        <li>Eliminar tu cuenta y tu contenido, desde Ajustes o desde esta web.</li>
      </ul>

      <h2>Edad mínima</h2>
      <p>Intimate es solo para mayores de 18 años.</p>
    </>
  );
}
