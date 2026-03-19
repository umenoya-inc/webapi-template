/**
 * @packageDocumentation
 * ## testing モジュール
 *
 * defineContract ベースの関数に対するテスト・モック用ユーティリティを提供する。
 *
 * ### エクスポート
 *
 * - `testContract` — 振る舞い別テストを網羅的に定義する。キーは実装の Desc ラベルから導出され、全ラベルの網羅が型レベルで強制される。
 * - `mockContract` — 振る舞い別モックを定義する。キーは `testContract` と同じ Desc ラベル。全ラベルの網羅が必須。
 * - `mockEnv` — Contract 関数の末尾引数（env）に渡すモックオブジェクトを型安全に構築する。
 *
 * ### テストの書き方
 *
 * DB 層（env なし）と Domain 層（env あり）でパターンが異なる。
 * 詳細は [テストファイルルール](../../docs/rule/test-file.md) を参照。
 */

export { mockEnv } from "./mockEnv.testutil"
export { mockContract } from "./mockContract.testutil"
export { testContract } from "./testContract.testutil"
