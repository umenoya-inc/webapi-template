import { drizzle } from "drizzle-orm/node-postgres"
import { envvar } from "@/envvar"

export const drizzleClient = drizzle(envvar.DATABASE_URL)
