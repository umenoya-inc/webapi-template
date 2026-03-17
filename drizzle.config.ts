import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/modules/db/**/*Table.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env["DATABASE_URL"]!,
  },
})
