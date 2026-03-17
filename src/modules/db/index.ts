/**
 * ## db モジュール
 *
 * Drizzle ORM + node-postgres によるDBアクセスを提供する。
 * 実装の詳細（NodePgDatabase等）はモジュール外に公開しない。
 *
 * ### エクスポート
 *
 * - `DbContext` — opaque なDB接続コンテキスト型。DB操作関数の第一引数に渡す。
 * - `globalDbContext` — トランザクション外で使用するグローバルな DbContext。
 * - `dbTransaction` — トランザクション実行。コールバックに DbContext が渡される。
 *   コールバックの戻り値は `{ ok: true } | { ok: false }` を満たす任意の Discriminated Union。
 *   コールバックが `ok: false` を返した場合は自動でロールバックされる。
 *   トランザクション自体の失敗（DB接続断等）は例外として伝播する。
 *
 * ### DB操作関数の追加
 *
 * ネストモジュールとして配置する（例: `db/user/`, `db/order/`）。
 * 各関数は `DbContext` を第一引数に取り、`fromDbContext` で内部の NodePgDatabase に変換して使用する。
 *
 * ```typescript
 * import type { DbContext } from "./DbContext"
 * import { fromDbContext } from "./fromDbContext"
 * import { users } from "./schema"
 * import { eq } from "drizzle-orm"
 *
 * type FindUserResult =
 *   | { ok: true; value: User }
 *   | { ok: false; reason: "not_found" }
 *
 * export const findUserById = async (
 *   ctx: DbContext,
 *   id: string,
 * ): Promise<FindUserResult> => {
 *   const db = fromDbContext(ctx)
 *   const rows = await db.select().from(users).where(eq(users.id, id))
 *   if (rows.length === 0) return { ok: false, reason: "not_found" }
 *   return { ok: true, value: rows[0] }
 * }
 * ```
 *
 * ### 利用側（route層・ビジネスロジック）
 *
 * ```typescript
 * import { globalDbContext, dbTransaction } from "@/modules/db"
 * import { findUserById } from "@/modules/db/user"
 *
 * // トランザクションなし
 * const result = await findUserById(globalDbContext, "user-1")
 *
 * // トランザクションあり
 * const result = await dbTransaction(async (ctx) => {
 *   return await findUserById(ctx, "user-1")
 * })
 * ```
 */

export type { DbContext } from "./DbContext"
export { globalDbContext } from "./globalDbContext"
export { dbTransaction } from "./dbTransaction"
