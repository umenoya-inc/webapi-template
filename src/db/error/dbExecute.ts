import type { DbError } from "./DbError"

/**
 * DB 操作を実行し、ドライバ固有のエラーを正規化された DbError に変換する。
 * 成功時はそのまま結果を返し、DB エラー時は DbError を返す。
 * DB エラー以外の予期しないエラーは throw する。
 */
export const dbExecute = async <T>(
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: DbError }> => {
  try {
    const value = await fn()
    return { ok: true, value }
  } catch (e) {
    const pgError = findPgError(e)
    if (pgError) {
      return { ok: false, error: normalizePgError(pgError) }
    }
    throw e
  }
}

type PgErrorLike = { code: string; constraint?: string }

/**
 * ドライバ固有のエラーから PostgreSQL エラー情報を探す。
 * node-postgres は直接プロパティに持ち、Drizzle + PGlite は cause チェーンに持つため、
 * 両方のパターンに対応する。
 */
function findPgError(e: unknown): PgErrorLike | null {
  if (isPgErrorLike(e)) return e
  if (e instanceof Error && e.cause) {
    return findPgError(e.cause)
  }
  return null
}

function isPgErrorLike(e: unknown): e is PgErrorLike {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as PgErrorLike).code === "string"
  )
}

/**
 * PostgreSQL エラーコードに基づいて DbError に変換する。
 * - 23505: unique_violation
 * - その他: unknown
 */
function normalizePgError(e: PgErrorLike): DbError {
  switch (e.code) {
    case "23505":
      return { kind: "unique_violation", field: extractField(e.constraint) }
    default:
      return { kind: "unknown", cause: e }
  }
}

/**
 * Drizzle が生成する制約名（"テーブル名_フィールド名_unique"）からフィールド名を抽出する。
 */
function extractField(constraint?: string): string {
  const match = (constraint ?? "").match(/_([^_]+)_/)
  if (match) return match[1]
  return "unknown"
}
