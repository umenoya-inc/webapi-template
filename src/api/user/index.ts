/**
 * @packageDocumentation
 * ## user API サブモジュール
 *
 * ユーザー管理の API ハンドラとルート定義を提供する。
 * ハンドラロジック（RouteEffect）はモジュール内部でのみ使用し、外部にはエクスポートしない。
 *
 * ### エクスポート
 *
 * - `userRoutes` — ユーザー API のルートをまとめた Hono インスタンス
 */

export { userRoutes } from "./userRoutes"
