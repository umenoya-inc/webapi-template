/**
 * @packageDocumentation
 * ## testing モジュール
 *
 * テスト用の共有ユーティリティを提供する。
 *
 * ### エクスポート
 *
 * - `mockContract` — defineContract ベースの関数に対する振る舞い別モックを定義する
 * - `testContract` — defineContract ベースの関数に対する振る舞い別テストを網羅的に定義する
 */

export { mockContract } from "./mockContract.testutil"
export { testContract } from "./testContract.testutil"
