import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/database/src/schema.ts",
  out: "./packages/database/drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://tiny_url:tiny_url_dev@localhost:5432/tiny_url",
  },
});