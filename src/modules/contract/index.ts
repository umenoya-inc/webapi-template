/**
 * @packageDocumentation
 * ## contract モジュール
 *
 * Design by Contract パターンを Valibot スキーマで実現する。
 *
 * ### エクスポート
 *
 * - `defineContract` — input/output スキーマと（任意で）エラーハンドラを受け取り、契約付き関数を返す。
 * - `matchContract` — Contract 関数の戻り値に対する exhaustive なパターンマッチ。
 * - `failAs` — 説明ラベル付きのエラー値を生成する。`as const` の代わりに使用する。
 * - `okAs` — 説明ラベル付きの成功値を生成する。`as const` の代わりに使用する。
 * - `Desc` — 値に説明ラベルを付与するファントム型。`failAs` / `okAs` の戻り値型として使われる。
 *
 * ### 使い方
 *
 * 検証対象外の引数（DbContext, env 等）はカリー化で外側に出し、
 * `defineContract` には検証対象の input のみを渡す。
 * input / output スキーマは通常の引数の感覚でインラインに定義できる。
 * 複雑なスキーマの場合のみ別ファイルに切り出す。
 *
 * ```typescript
 * import type { DbContext } from "@/modules/db"
 * import { flatten, minValue, number, object, pipe, string, uuid } from "valibot"
 * import { defineContract } from "@/modules/contract"
 * import { User } from "@/modules/db/user"
 *
 * export const createUser = (ctx: DbContext) =>
 *   defineContract({
 *     input: object({
 *       name: pipe(string(), minLength(1), maxLength(100)),
 *       email: pipe(string(), email()),
 *     }),
 *     output: User,
 *     onInputError: (issues) => ({
 *       ok: false,
 *       reason: "validation_failed",
 *       fields: flatten(issues).nested ?? {},
 *     } as const),
 *     fn: async (input) => {
 *       // input は検証済み、ctx はクロージャ経由
 *       // return { ok: true, value: { id, name, email } }
 *       // return { ok: false, reason: "duplicate_entry", field: "email" }
 *     },
 *   })
 * ```
 *
 * ### 動作
 *
 * - **input**: 常に Valibot スキーマで検証する。失敗時は `onInputError` の返り値を返す。
 *   - `onInputError` は省略可能。省略時は `{ ok: false, reason: "validation_failed", fields: { ... } }` を返す。
 *   - カスタムする場合の引数は Valibot の issues タプル。`flatten(issues)` でフィールド別に変換可能。
 * - **output**: `fn` が `{ ok: true, value }` を返した場合、`value` を output スキーマで parse する。
 *   TypeScript の型では表現できないドメイン制約（UUID 形式、値の範囲等）のランタイム検証と、
 *   Branded Types への変換を行う。
 */

export type { Desc } from "./Desc"
export { defineContract } from "./defineContract"
export { failAs } from "./failAs"
export { matchContract } from "./matchContract"
export { okAs } from "./okAs"
