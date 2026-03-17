/**
 * ## contract モジュール
 *
 * Design by Contract パターンを Valibot スキーマで実現する。
 *
 * ### エクスポート
 *
 * - `defineContract` — input/output スキーマとエラーハンドラを受け取り、契約付き関数を返す。
 *
 * ### 使い方
 *
 * 検証対象外の引数（DbContext, env 等）はカリー化で外側に出し、
 * `defineContract` には検証対象の input のみを渡す。
 * input / output スキーマは通常の引数の感覚でインラインに定義できる。
 * 複雑なスキーマの場合のみ別ファイルに切り出す。
 *
 * ```typescript
 * import type { Result } from "@/types/Result"
 * import type { DbContext } from "@/modules/db"
 * import { object, pipe, string, uuid } from "valibot"
 * import { defineContract } from "@/modules/contract"
 * import type { User } from "./User"
 *
 * // Result<T, E> でシンプルに返すケース
 * export const findUserById = (ctx: DbContext) =>
 *   defineContract({
 *     input: object({ id: pipe(string(), uuid()) }),
 *     output: object({ ok: boolean(), value: object({ ... }) }),
 *     onInputError: () => ({ ok: false, error: "validation_failed" } as const),
 *     fn: async (input): Promise<Result<User, "not_found">> => {
 *       // input.id は string & uuid 検証済み、ctx はクロージャ経由
 *     },
 *   })
 *
 * // カスタム DU + flatten でフィールド別エラーを返すケース
 * import { flatten, minValue, number } from "valibot"
 *
 * export const createOrder = (ctx: DbContext) =>
 *   defineContract({
 *     input: object({
 *       productId: pipe(string(), uuid()),
 *       quantity: pipe(number(), minValue(1)),
 *     }),
 *     output: object({ ok: boolean() }),
 *     onInputError: (issues) => ({
 *       ok: false,
 *       reason: "validation_failed",
 *       fields: flatten(issues).nested ?? {},
 *       // => { productId: ["UUIDの形式が不正です"], quantity: ["1以上の値を指定してください"] }
 *     } as const),
 *     fn: async (input) => {
 *       // input.productId, input.quantity は検証済み
 *       // return { ok: false, reason: "out_of_stock", productId, available }
 *       // return { ok: true, value: order }
 *     },
 *   })
 * ```
 *
 * ### 呼び出し
 *
 * ```typescript
 * // シンプルなケース
 * const result = await findUserById(ctx)({ id: "user-1" })
 * if (!result.ok) {
 *   // result.error: "not_found" | "validation_failed"
 * }
 *
 * // カスタム DU のケース
 * const result = await createOrder(ctx)({ productId: "p-1", quantity: 3 })
 * if (!result.ok) {
 *   switch (result.reason) {
 *     case "validation_failed":
 *       // result.fields でフィールド別のエラーメッセージにアクセス可能
 *       break
 *     case "out_of_stock":
 *       // result.productId, result.available にアクセス可能
 *       break
 *   }
 * }
 * ```
 *
 * ### 動作
 *
 * - **input 検証**: 常に実行。失敗時は `onInputError` の返り値を返す。
 *   - `onInputError` の引数は Valibot の issues タプル。`flatten(issues)` でフィールド別に変換可能。
 * - **output 検証**: `NODE_ENV === "test"` 時のみ実行。失敗時は throw（バグ検出用）。
 */

export { defineContract } from "./defineContract"
