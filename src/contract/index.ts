/**
 * @packageDocumentation
 * ## contract モジュール
 *
 * Valibot スキーマによる入出力検証付き関数定義を提供する。
 * 振る舞いパスの型表現（Desc, okAs, failAs 等）は behavior モジュールに委譲し、
 * スキーマ検証を上乗せする。
 *
 * ### エクスポート
 *
 * - `defineContract` — defineBehavior + withSchema の合成。input/output スキーマ付きで関数を定義する。
 * - `withSchema` — Valibot スキーマによる入出力検証を関数に適用する。
 *
 * ### behavior モジュールからの再エクスポート
 *
 * `defineContract` と併用する `okAs` / `failAs` 等は behavior モジュールから再エクスポートする。
 * 利用側は `@/contract` からまとめてインポートできる。
 *
 * ### 使い方
 *
 * ```typescript
 * import type { DbContext } from "@/db"
 * import { object, pipe, string, email, minLength, maxLength } from "valibot"
 * import { defineContract, failAs, okAs } from "@/contract"
 * import { User } from "@/db/user"
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

// behavior モジュールからの再エクスポート
export type { BehaviorBrand, Desc, DescLabel, ExtractByLabel } from "@/behavior"
export { defineBehavior, failAs, matchBehavior, okAs } from "@/behavior"

// contract 固有のエクスポート
export { defineContract } from "./defineContract"
export { withSchema } from "./withSchema"
