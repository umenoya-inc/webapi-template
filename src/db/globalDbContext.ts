import type { DbContext } from "./DbContext"
import { drizzleClient } from "./drizzleClient"
import { toDbContext } from "./toDbContext"

export const globalDbContext: DbContext = toDbContext(drizzleClient)
