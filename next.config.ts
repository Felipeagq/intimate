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
   * En Amplify WEB_COMPUTE las variables configuradas en la consola existen
   * durante el BUILD pero no llegan al proceso SSR en runtime. Declararlas
   * aquí hace que Next las inserte en tiempo de build, que es cuando Amplify
   * sí las expone. Sin este bloque, la base de datos, el correo y las fotos
   * funcionan en local (.env) pero fallarían en producción.
   *
   * Next solo las incrusta donde se referencian. Todas se leen desde
   * `src/server/env.ts`, que es código de servidor: por eso no acaban en el
   * paquete que descarga el navegador. Mantener esa regla es lo que las deja
   * fuera del cliente, así que ninguna debe leerse desde un componente
   * marcado con "use client".
   */
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    EMAIL: process.env.EMAIL,
    EMAIL_NOMBRE: process.env.EMAIL_NOMBRE,

    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_FOLDER: process.env.S3_FOLDER,
    S3_AWS_ACCESS_KEY_ID: process.env.S3_AWS_ACCESS_KEY_ID,
    S3_AWS_SECRET_ACCESS_KEY: process.env.S3_AWS_SECRET_ACCESS_KEY,
  },
};

export default nextConfig;
