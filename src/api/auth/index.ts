/**
 * @packageDocumentation
 * ## auth API サブモジュール
 *
 * 認証に関する API ハンドラ、ルート定義、ミドルウェアを提供する。
 *
 * ### エクスポート
 *
 * - `AuthContext` — 認証済みユーザーのコンテキスト型
 * - `getAuthContext` — Hono Context から AuthContext を取り出す
 * - `authMiddleware` — Bearer トークンによる認証ミドルウェア
 * - `postLogin` — ログインハンドラロジック
 * - `postLoginRoute` — ログインルート定義
 */

export type { AuthContext } from "./AuthContext"
export type { AuthEnv } from "./AuthEnv"
export { getAuthContext } from "./getAuthContext"
export { authMiddleware } from "./authMiddleware"
export { postLogin } from "./postLogin"
export { postLoginRoute } from "./postLoginRoute"
