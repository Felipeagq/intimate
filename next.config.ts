import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
