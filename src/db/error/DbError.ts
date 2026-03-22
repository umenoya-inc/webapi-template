/**
 * ドライバに依存しない正規化された DB エラー型。
 * pgExecute がドライバ固有のエラーをこの型に変換する。
 */
export type DbError =
  | { kind: "unique_violation"; field: string }
  | { kind: "unknown"; cause: unknown }
