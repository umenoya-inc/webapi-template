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
 *
 * ```typescript
 * import type { Result } from "@/types/Result"
 * import type { DbContext } from "@/modules/db"
 * import { defineContract } from "@/modules/contract"
 * import { FindUserByIdInput, FindUserByIdOutput } from "./schema"
 *
 * // Result<T, E> でシンプルに返すケース
 * export const findUserById = (ctx: DbContext) =>
 *   defineContract({
 *     input: FindUserByIdInput,
 *     output: FindUserByIdOutput,
 *     onInputError: (issues) => ({ ok: false, error: "validation_failed" } as const),
 *     fn: async (input): Promise<Result<User, "not_found">> => {
 *       // input は検証済み、ctx はクロージャ経由
 *     },
 *   })
 *
 * // カスタム DU で詳細なエラー分岐が必要なケース
 * export const createOrder = (ctx: DbContext) =>
 *   defineContract({
 *     input: CreateOrderInput,
 *     output: CreateOrderOutput,
 *     onInputError: (issues) => ({
 *       ok: false,
 *       reason: "validation_failed",
 *       issues,
 *     } as const),
 *     fn: async (input) => {
 *       // ...
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
 *       // result.issues で詳細なバリデーションエラーにアクセス可能
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
 * - **output 検証**: `NODE_ENV === "test"` 時のみ実行。失敗時は throw（バグ検出用）。
 */

export { defineContract } from "./defineContract"
