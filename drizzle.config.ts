import { defineConfig } from "drizzle-kit";

// Node 22 carga .env sin dependencias extra.
process.loadEnvFile?.(".env");

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  casing: "snake_case",
});
