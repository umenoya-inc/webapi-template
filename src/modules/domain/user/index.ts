/**
 * @packageDocumentation
 * ## user ドメインサブモジュール
 *
 * ユーザー管理のビジネスロジックを提供する。
 * DB 操作は env パターンで注入し、テスト時にモック可能。
 *
 * ### エクスポート
 *
 * - `registerUser` — ユーザーを登録する
 * - `getUserById` — ID を指定してユーザーを取得する
 * - `getUsers` — ユーザー一覧を取得する
 */

export { registerUser } from "./registerUser"
export { getUserById } from "./getUserById"
export { getUsers } from "./getUsers"
