import { requireEnv } from "./requireEnv"

export const envvar = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
} as const
