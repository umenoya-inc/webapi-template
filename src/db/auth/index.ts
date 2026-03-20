/**
 * @packageDocumentation
 * ## auth サブモジュール
 *
 * 認証トークンの永続化と検索を担当する。
 *
 * ### エクスポート
 *
 * - `AuthTokenId` — Branded なトークンID型
 * - `AuthToken` — Branded な認証トークン型
 * - `createAuthToken` — 認証トークンを発行する
 * - `findAuthToken` — トークンで認証情報を検索する
 */

export { AuthTokenId } from "./AuthTokenId"
export { AuthToken } from "./AuthToken"
export { createAuthToken } from "./createAuthToken"
export { findAuthToken } from "./findAuthToken"
