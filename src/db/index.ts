/**
 * @packageDocumentation
 * ## db モジュール
 *
 * Drizzle ORM + node-postgres によるDBアクセスを提供する。
 * 実装の詳細（NodePgDatabase等）はモジュール外に公開しない。
 *
 * ### エクスポート
 *
 * - `DbContext` — opaque なDB接続コンテキスト型。Effect の context に渡す。
 * - `globalDbContext` — トランザクション外で使用するグローバルな DbContext。
 *
 * ### DB 操作の実行
 *
 * DB 操作関数の内部では `fromDbContext` で `DbClient` を取得し、
 * すべてのクエリを `db.execute(q => ...)` 経由で実行する。
 * `execute` は PG エラーを `PgResult` に変換し、生の NodePgDatabase はコールバック内に閉じ込める。
 *
 * ```typescript
 * import type { DbContext } from "./DbContext"
 * import { fromDbContext } from "./fromDbContext"
 *
 * const db = fromDbContext(context.db)
 *
 * // 読み取り
 * const result = await db.execute(q => q.select().from(users).where(eq(users.id, id)))
 *
 * // 書き込み（PG エラーのハンドリング）
 * const result = await db.execute(q => q.insert(users).values({...}).returning())
 * if (!result.ok) {
 *   if (result.error.kind === "unique_violation") return failAs(...)
 *   throw new Error("Unexpected database error", { cause: result.error })
 * }
 * ```
 *
 * ### トランザクション
 *
 * `DbClient.transaction` でトランザクションを実行する。
 * コールバックが `ok: false` を返した場合は自動でロールバックされる。
 *
 * ```typescript
 * const db = fromDbContext(context.db)
 * const result = await db.transaction(async (txDb) => {
 *   const r = await txDb.execute(q => q.insert(users).values({...}).returning())
 *   if (!r.ok) return { ok: false, reason: "failed" }
 *   return { ok: true, value: r.value }
 * })
 * ```
 */

export type { DbContext } from "./DbContext"
export { globalDbContext } from "./globalDbContext"
