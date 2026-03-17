import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type { DbContext } from "./DbContext"

export const toDbContext = (db: NodePgDatabase): DbContext => db as unknown as DbContext
