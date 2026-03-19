/**
 * @packageDocumentation
 * ## testing モジュール
 *
 * テスト用の共有ユーティリティを提供する。
 *
 * ### エクスポート
 *
 * - `mockEnv` — Contract 関数の env パラメータに渡すモックオブジェクトを型安全に構築する
 * - `mockContract` — defineContract ベースの関数に対する振る舞い別モックを定義する
 * - `testContract` — defineContract ベースの関数に対する振る舞い別テストを網羅的に定義する
 */

export { mockEnv } from "./mockEnv.testutil"
export { mockContract } from "./mockContract.testutil"
export { testContract } from "./testContract.testutil"
