import { PGlite } from "@electric-sql/pglite"
import { pushSchema } from "drizzle-kit/api"
import { drizzle } from "drizzle-orm/pglite"
import type { DbContext } from "../DbContext"

/**
 * テスト用のインメモリ PostgreSQL（PGlite）から DbContext を生成する。
 * Drizzle のテーブル定義から pushSchema でテーブルを自動作成する。
 *
 * @param tables - Drizzle のテーブル定義オブジェクト（例: { userTable }）
 */
export const createTestDbContext = async (
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
