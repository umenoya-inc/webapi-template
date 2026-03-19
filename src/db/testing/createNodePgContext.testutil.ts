import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { pushSchema } from "drizzle-kit/api"
import { drizzle } from "drizzle-orm/node-postgres"
import type { DbContext } from "../DbContext"
import { toDbContext } from "../toDbContext"

/**
 * node-postgres ドライバで DbContext を生成する（本番同等のドライバ互換性検証用）。
 * Testcontainers で PostgreSQL コンテナを起動するため、Docker が必要。
 * コンテナの起動に数秒かかるため、通常のテストでは PGlite を使用する。
 */
export const createNodePgContext = async (
  tables: Record<string, unknown>,
): Promise<{ ctx: DbContext; cleanup: () => Promise<void> }> => {
  const container = await new PostgreSqlContainer("postgres:17-alpine").start()
  const connectionUri = container.getConnectionUri()
  const db = drizzle(connectionUri)
  const { apply } = await pushSchema(tables, db)
  await apply()
  return {
    ctx: toDbContext(db),
    cleanup: async () => {
      await container.stop()
    },
  }
}
