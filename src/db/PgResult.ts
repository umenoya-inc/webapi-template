import type { DbError } from "./error/DbError"

/** DB 操作の結果型。成功時は値、PG エラー時は DbError を返す。 */
export type PgResult<T> = { ok: true; value: T } | { ok: false; error: DbError }
