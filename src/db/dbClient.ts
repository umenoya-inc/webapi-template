import { drizzle } from "drizzle-orm/node-postgres"
import { envvar } from "@/envvar"

export const dbClient = drizzle(envvar.DATABASE_URL)
