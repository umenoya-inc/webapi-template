/**
 * ## db モジュール
 *
 * Drizzle ORM + node-postgres によるDBアクセスを提供する。
 * 実装の詳細（NodePgDatabase等）はモジュール外に公開しない。
 *
 * ### エクスポート
 *
 * - `DbContext` — opaque なDB接続コンテキスト型。DB操作関数の第一引数に渡す。
 * - `dbContext` — トランザクション外で使用するグローバルな DbContext。
 * - `dbTransaction` — トランザクション実行。コールバックに DbContext が渡される。
 *
 * ### DB操作関数の追加
 *
 * ネストモジュールとして配置する（例: `db/user/`, `db/order/`）。
 * 各関数は `DbContext` を第一引数に取り、`fromDbContext` で内部の NodePgDatabase に変換して使用する。
 *
 * ```typescript
 * import type { DbContext } from "./DbContext"
 * import type { Result } from "@/types/Result"
 * import { fromDbContext } from "./fromDbContext"
 * import { users } from "./schema"
 * import { eq } from "drizzle-orm"
 *
 * export const findUserById = async (
 *   ctx: DbContext,
 *   id: string,
 * ): Promise<Result<User, "not_found">> => {
 *   const db = fromDbContext(ctx)
 *   const rows = await db.select().from(users).where(eq(users.id, id))
 *   if (rows.length === 0) return { ok: false, error: "not_found" }
 *   return { ok: true, value: rows[0] }
 * }
 * ```
 *
 * ### 利用側（route層・ビジネスロジック）
 *
 * ```typescript
 * import { dbContext, dbTransaction } from "@/modules/db"
 * import { findUserById } from "@/modules/db/user"
 *
 * // トランザクションなし
 * const result = await findUserById(dbContext, "user-1")
 *
 * // トランザクションあり
 * const result = await dbTransaction(async (ctx) => {
 *   return await findUserById(ctx, "user-1")
 * })
 * ```
 */

export type { DbContext } from "./DbContext"
export { dbContext } from "./dbContext"
export { dbTransaction } from "./dbTransaction"
