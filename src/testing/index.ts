/**
 * @packageDocumentation
 * ## testing モジュール
 *
 * defineBehavior / defineContract ベースの関数に対するテスト・モック用ユーティリティを提供する。
 *
 * ### エクスポート
 *
 * - `testBehavior` — 振る舞い別テストを網羅的に定義する。キーは実装の Desc ラベルから導出され、全ラベルの網羅が型レベルで強制される。
 * - `parameterize` — testBehavior の各ラベルに対し、複数の入力パターンをパラメタライズドテストとして定義する。
 * - `propertyCheck` — testBehavior の各ラベルに対し、スキーマ由来の arbitrary でプロパティベーステストを定義する。
 * - `mockBehavior` — 振る舞い別モックを定義する。キーは `testBehavior` と同じ Desc ラベル。全ラベルの網羅が必須。
 * - `mockEnv` — Contract 関数の末尾引数（env）に渡すモックオブジェクトを型安全に構築する。
 * - `mockService` — Effect 用のモック service を構築する。直接依存の Fn のみ要求し、`(context) => Fn` にラップして返す。
 *
 * ### テストの書き方
 *
 * DB 層（env なし）と Domain 層（env あり）でパターンが異なる。
 * 詳細は [テストファイルルール](../../docs/rule/test-file.md) を参照。
 */

export { mockBehavior } from "./mockBehavior.testutil"
export { mockEnv } from "./mockEnv.testutil"
export { mockService } from "./mockService.testutil"
export { parameterize } from "./parameterize.testutil"
export { propertyCheck } from "./propertyCheck.testutil"
export { testBehavior } from "./testBehavior.testutil"
