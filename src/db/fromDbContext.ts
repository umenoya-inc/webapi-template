import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type { Fallible } from "@/types"
import type { DbClient } from "./DbClient"
import type { DbContext } from "./DbContext"
import { pgExecute } from "./error/pgExecute"

export const fromDbContext = (ctx: DbContext): DbClient => {
  const db = ctx as unknown as NodePgDatabase
  return createDbClient(db)
}

const rollbackSymbol = Symbol("rollback")

const createDbClient = (db: NodePgDatabase): DbClient => ({
  execute: (fn) => pgExecute(() => fn(db)),
  query: (fn) => fn(db),
  transaction: async <F extends Fallible>(fn: (client: DbClient) => Promise<F>): Promise<F> => {
    let failedResult: (F & { ok: false }) | undefined
    try {
      return await db.transaction(async (tx) => {
        const result = await fn(createDbClient(tx))
        if (!result.ok) {
          failedResult = result as F & { ok: false }
          throw rollbackSymbol
        }
        return result
      })
    } catch (e) {
      if (e === rollbackSymbol && failedResult) {
        return failedResult
      }
      throw e
    }
  },
})
