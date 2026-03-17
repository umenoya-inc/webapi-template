import { PGlite } from "@electric-sql/pglite"
import { pushSchema } from "drizzle-kit/api"
import { drizzle } from "drizzle-orm/pglite"
import type { DbContext } from "../DbContext"

/**
 * PGlite（インメモリ PostgreSQL）で DbContext を生成する。
 * ローカル開発時のデフォルト。高速だが node-postgres とは異なるドライバを使用する。
 */
export const createPgliteContext = async (
  tables: Record<string, unknown>,
): Promise<{ ctx: DbContext; cleanup: () => Promise<void> }> => {
  const client = new PGlite()
  const db = drizzle(client)
  const { apply } = await pushSchema(tables, db)
  await apply()
  return {
    ctx: db as unknown as DbContext,
    cleanup: async () => {
      await client.close()
    },
  }
}
