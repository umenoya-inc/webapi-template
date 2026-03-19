/**
 * @packageDocumentation
 * ## envvar モジュール
 *
 * 環境変数を型安全に取得する。import 時点でバリデーションが実行され、
 * 必要な環境変数が未設定の場合はアプリケーション起動時に即座にエラーとなる。
 *
 * ### 利用
 *
 * ```typescript
 * import { envvar } from "@/envvar"
 *
 * const url = envvar.DATABASE_URL // string（型安全・バリデーション済み）
 * ```
 *
 * ### 環境変数の追加
 *
 * `envvar.ts` に1行追加するだけで、型とバリデーションが自動的に適用される。
 *
 * ```typescript
 * export const envvar = {
 *   DATABASE_URL: requireEnv("DATABASE_URL"),
 *   REDIS_URL: requireEnv("REDIS_URL"), // ← 追加
 * } as const
 * ```
 */

export { envvar } from "./envvar"
