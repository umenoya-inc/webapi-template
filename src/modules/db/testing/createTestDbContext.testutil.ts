import type { DbContext } from "../DbContext"
import { createNodePgContext } from "./createNodePgContext.testutil"
import { createPgliteContext } from "./createPgliteContext.testutil"

/**
 * テスト用の DbContext を生成する。
 *
 * - デフォルト: PGlite（インメモリ、高速）
 * - `TEST_USE_NODE_PG=true`: node-postgres + Testcontainers で実 PostgreSQL を使用（ドライバ互換性検証用）
 *
 * @param tables - Drizzle のテーブル定義オブジェクト（例: { userTable }）
 */
export const createTestDbContext = async (
  tables: Record<string, unknown>,
): Promise<{ ctx: DbContext; cleanup: () => Promise<void> }> => {
  if (process.env["TEST_USE_NODE_PG"] === "true") {
    return createNodePgContext(tables)
  }
  return createPgliteContext(tables)
}
