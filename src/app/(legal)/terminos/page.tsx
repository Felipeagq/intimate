export const metadata = { title: "Términos de uso" };

export default function TerminosPage() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl">Términos de uso</h1>
      <p className="text-muted text-sm">Última actualización: 25 de octubre de 2026</p>

      <h2>Qué es Intimate</h2>
      <p>
        Una herramienta para que dos personas construyan hábitos espirituales
        juntas. Acompaña, pero no reemplaza la Biblia, la iglesia, ni la
        consejería pastoral, psicológica o de pareja.
      </p>

      <h2>Tu cuenta</h2>
      <ul>
        <li>Debes ser mayor de 18 años.</li>
        <li>Una persona puede pertenecer a una sola pareja activa a la vez.</li>
        <li>Eres responsable de lo que escribes y compartes.</li>
      </ul>

      <h2>El espacio de pareja</h2>
      <p>
        Se crea con el consentimiento de ambas personas y cualquiera puede salir
        de él en cualquier momento, sin aviso previo a la otra.
      </p>

      <h2>Qué no está permitido</h2>
      <ul>
        <li>Usar la cuenta de otra persona o acceder a su contenido sin permiso.</li>
        <li>Usar Intimate para hostigar, presionar o controlar a otra persona.</li>
      </ul>

      <h2>Si estás en peligro</h2>
      <p>
        Si vives una situación de violencia o abuso, busca ayuda profesional o
        de emergencia en tu país. Intimate no es un servicio de emergencia.
      </p>
    </>
  );
}
