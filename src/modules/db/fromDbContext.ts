import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type { DbContext } from "./DbContext"

export const fromDbContext = (ctx: DbContext): NodePgDatabase => ctx as unknown as NodePgDatabase
