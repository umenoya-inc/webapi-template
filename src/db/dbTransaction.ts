import type { Fallible } from "@/types"
import type { DbContext } from "./DbContext"
import { dbClient } from "./dbClient"
import { toDbContext } from "./toDbContext"

const rollbackSymbol = Symbol("rollback")

export const dbTransaction = async <F extends Fallible>(
  fn: (ctx: DbContext) => Promise<F>,
): Promise<F> => {
  let failedResult: (F & { ok: false }) | undefined
  try {
    return await dbClient.transaction(async (tx) => {
      const result = await fn(toDbContext(tx))
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
}
