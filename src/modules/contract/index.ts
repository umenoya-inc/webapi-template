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
 * - `DescLabel` — Desc ブランドからラベル文字列を抽出するヘルパー型。
 * - `ExtractByLabel` — Desc ラベルで union メンバーを抽出するヘルパー型。
 *
 * ### 使い方
 *
 * 検証対象外の引数（DbContext, env 等）はカリー化で外側に出し、
 * `defineContract` には検証対象の input のみを渡す。
 * input / output スキーマは通常の引数の感覚でインラインに定義できる。
 * 複雑なスキーマの場合のみ別ファイルに切り出す。
 *
 * `fn` 内では `okAs` / `failAs` を使って各コードパスに説明ラベルを付与する。
 * 素のオブジェクトリテラルを返すと型エラーになる。
 *
 * ```typescript
 * import type { DbContext } from "@/modules/db"
 * import { object, pipe, string, email, minLength, maxLength } from "valibot"
 * import { defineContract, failAs, okAs } from "@/modules/contract"
 * import { User } from "@/modules/db/user"
 *
 * export const createUser = (ctx: DbContext) =>
 *   defineContract({
 *     input: object({
 *       name: pipe(string(), minLength(1), maxLength(100)),
 *       email: pipe(string(), email()),
 *     }),
 *     output: User,
 *     fn: async (input) => {
 *       // ...
 *       if (duplicateEmail) {
 *         return failAs("メールアドレスが既存ユーザーと重複", "duplicate_entry", { field: "email" })
 *       }
 *       return okAs("ユーザーを新規作成", { id: row.id, name: row.name, email: row.email })
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

export type { ContractBrand } from "./ContractBrand"
export type { Desc } from "./Desc"
export type { DescLabel } from "./DescLabel"
export { defineContract } from "./defineContract"
export type { ExtractByLabel } from "./ExtractByLabel"
export { failAs } from "./failAs"
export { matchContract } from "./matchContract"
export { okAs } from "./okAs"
