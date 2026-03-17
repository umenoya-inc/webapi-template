/**
 * PostgreSQL の制約違反エラーから、違反が発生したフィールド名を抽出する。
 * node-postgres の DatabaseError.constraint には制約名が格納されており、
 * Drizzle が生成する制約名は "テーブル名_フィールド名_unique" の形式になるため、
 * アンダースコア区切りの2番目の要素をフィールド名として取り出す。
 * 抽出できない場合は "unknown" を返す。
 */
export const extractConstraintField = (e: Error & { constraint?: string }): string => {
  const constraint = e.constraint ?? ""
  const match = constraint.match(/_([^_]+)_/)
  if (match) return match[1]
  return "unknown"
}
