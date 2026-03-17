/**
 * PostgreSQL の UNIQUE 制約違反エラー（エラーコード 23505: unique_violation）かどうかを判定する。
 * node-postgres の DatabaseError は { code: string, constraint?: string } を持ち、
 * code が "23505" の場合は UNIQUE 制約違反を示す。
 */
export const isDuplicateKeyError = (
  e: unknown,
): e is Error & { code: string; constraint?: string } =>
  e instanceof Error && "code" in e && (e as Record<string, unknown>).code === "23505"
