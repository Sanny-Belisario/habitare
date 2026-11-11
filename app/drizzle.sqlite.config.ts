import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "expo",
  schema: "./src/db/sqlite/schema.ts",
  out: "./drizzle/sqlite",
});
