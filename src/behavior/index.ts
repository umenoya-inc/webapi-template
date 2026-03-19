/**
 * @packageDocumentation
 * ## behavior モジュール
 *
 * 振る舞いパスの型表現とテスト網羅強制の基盤を提供する。
 * Valibot 等のスキーマ検証には依存しない。
 *
 * ### エクスポート
 *
 * - `defineBehavior` — 関数に BehaviorBrand を付与し、testBehavior / mockBehavior で使用可能にする。
 * - `matchBehavior` — Behavior 関数の戻り値に対する exhaustive なパターンマッチ。
 * - `failAs` — 説明ラベル付きのエラー値を生成する。
 * - `okAs` — 説明ラベル付きの成功値を生成する。
 * - `Desc` — 値に説明ラベルを付与するブランド型。
 * - `BehaviorBrand` — defineBehavior の戻り値に付与されるブランド型。
 * - `DescLabel` — Desc ブランドからラベル文字列を抽出するヘルパー型。
 * - `ExtractByLabel` — Desc ラベルで union メンバーを抽出するヘルパー型。
 * - `InputScenarios` — Desc に入力シナリオラベルを付与するブランド型。
 * - `ExtractInputScenarios` — Desc ラベルに対応するシナリオ文字列を抽出するヘルパー型。
 */

export type { BehaviorBrand } from "./BehaviorBrand"
export type { Desc } from "./Desc"
export type { DescLabel } from "./DescLabel"
export type { ExtractByLabel } from "./ExtractByLabel"
export type { ExtractInputScenarios } from "./ExtractInputScenarios"
export type { InputScenarios } from "./InputScenarios"
export { defineBehavior } from "./defineBehavior"
export { failAs } from "./failAs"
export { matchBehavior } from "./matchBehavior"
export { okAs } from "./okAs"
