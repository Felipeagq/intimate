import { defineConfig } from "drizzle-kit";

// Node 22 carga .env sin dependencias extra.
process.loadEnvFile?.(".env");

export default defineConfig({
  schema: [
    "./src/server/db/schema.ts",
    "./src/server/db/schema-admin.ts",
    "./src/server/db/schema-app.ts",
    "./src/server/db/schema-audit.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  casing: "snake_case",
});
