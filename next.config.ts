import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Salida autocontenida: el build produce un servidor con sus dependencias
   * incluidas. Es una de las reglas de portabilidad del documento, y lo que
   * permite empaquetar la app en una imagen para ECS sin reescribir código.
   */
  output: "standalone",

  /**
   * `next dev` y `next build` comparten `.next` por defecto, así que una
   * compilación de verificación reescribe los chunks del servidor de
   * desarrollo que esté corriendo y lo deja con "Cannot find module".
   *
   * Con esto, una build de comprobación puede ir a otro directorio:
   *   NEXT_DIST_DIR=.next-build pnpm build
   *
   * El despliegue no pasa la variable, así que sigue usando `.next`.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",

  /**
   * Nota sobre variables de entorno en Amplify: aquí NO va un bloque `env`
   * para "inyectarlas". Se intentó y no sirve para este proyecto, por dos
   * razones:
   *
   * 1. La clave `env` de Next.js solo sustituye el texto literal
   *    `process.env.CLAVE` donde aparece en el código (es una sustitución
   *    de webpack, no una variable de entorno real). `src/server/env.ts`
   *    lee `process.env` como objeto completo con
   *    `schema.safeParse(process.env)`, así que no hay ningún
   *    `process.env.DATABASE_URL` literal que sustituir.
   *
   * 2. Aunque se leyeran una por una, el cómputo SSR de Amplify no hereda
   *    las variables configuradas en la consola: esas solo existen como
   *    variables de shell durante el build. Así lo documenta AWS.
   *
   * La solución real está en `amplify.yml`: ahí se vuelcan las variables de
   * la consola a `.env.production` durante el build, que es el archivo que
   * Next.js carga automáticamente tanto al compilar como al arrancar el
   * servidor que atiende cada petición. Si se agrega una variable nueva a
   * `src/server/env.ts`, hay que añadirla también a esa línea de
   * `amplify.yml`, o nunca llegará a producción aunque esté en la consola.
   */
};

export default nextConfig;
