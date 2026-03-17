import type { DbContext } from "./DbContext"
import { dbClient } from "./dbClient"
import { toDbContext } from "./toDbContext"

export const dbContext: DbContext = toDbContext(dbClient)
