import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type { DbContext } from "../DbContext"

/** テスト専用。DbContext から生の Drizzle クライアントを取り出す。 */
export const rawDb = (ctx: DbContext): NodePgDatabase => ctx as unknown as NodePgDatabase
