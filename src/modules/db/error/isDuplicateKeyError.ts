/**
 * PostgreSQL の UNIQUE 制約違反エラー（エラーコード 23505: unique_violation）かどうかを判定する。
 * node-postgres の DatabaseError は { code: string, constraint?: string } を持ち、
 * code が "23505" の場合は UNIQUE 制約違反を示す。
 * Drizzle がラップしたエラーの場合は cause チェーンを辿って判定する。
 */
export const isDuplicateKeyError = (
  e: unknown,
): e is Error & { code: string; constraint?: string } => {
  const target = findDuplicateKeyError(e)
  if (target && e instanceof Error) {
    // cause から取得したプロパティを元のエラーにコピーして型ガードを成立させる
    Object.assign(e, { code: target.code, constraint: target.constraint })
    return true
  }
  return false
}

function findDuplicateKeyError(e: unknown): { code: string; constraint?: string } | null {
  if (hasDuplicateKeyCode(e)) return e
  if (e instanceof Error && e.cause) {
    return findDuplicateKeyError(e.cause)
  }
  return null
}

function hasDuplicateKeyCode(e: unknown): e is { code: string; constraint?: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as Record<string, unknown>).code === "23505"
  )
}
