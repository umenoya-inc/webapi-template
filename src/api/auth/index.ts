/**
 * @packageDocumentation
 * ## auth API サブモジュール
 *
 * 認証に関する API ハンドラ、ルート定義、ミドルウェアを提供する。
 * ハンドラロジック（RouteEffect）はモジュール内部でのみ使用し、外部にはエクスポートしない。
 *
 * ### エクスポート
 *
 * - `authRoutes` — 認証 API のルートをまとめた Hono インスタンス
 * - `AuthContext` — 認証済みユーザーのコンテキスト型
 * - `AuthEnv` — authMiddleware が Hono Context に設定する Variables の型
 * - `getAuthContext` — Hono Context から AuthContext を取り出す
 * - `authMiddleware` — Bearer トークンによる認証ミドルウェア
 */

export { authRoutes } from "./authRoutes"
export type { AuthContext } from "./AuthContext"
export type { AuthEnv } from "./AuthEnv"
export { getAuthContext } from "./getAuthContext"
export { authMiddleware } from "./authMiddleware"
