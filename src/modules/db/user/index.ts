/**
 * @packageDocumentation
 * ## user サブモジュール
 *
 * ユーザーの永続化と取得を担当する。
 * ユーザーの一意性は email で保証される。
 *
 * ### エクスポート
 *
 * - `User` — Branded なユーザー型
 * - `createUser` — ユーザーを新規作成する
 * - `findUserById` — ID を指定してユーザーを取得する
 * - `listUsers` — ユーザー一覧を取得する
 */

export { User } from "./User"
export { createUser } from "./createUser"
export { findUserById } from "./findUserById"
export { listUsers } from "./listUsers"
