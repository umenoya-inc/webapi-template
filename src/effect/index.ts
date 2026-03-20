/**
 * @packageDocumentation
 * ## effect モジュール
 *
 * 軽量 Effect System。`defineEffect` で副作用を持つ計算を定義し、
 * 依存の自動合成と副作用の型レベル明示を実現する。
 *
 * ### エクスポート
 *
 * - `defineEffect` — 副作用を持つ計算を定義する。deps に service / context を宣言し、fn で実装する。
 * - `resolveEffects` — フラットな Effect 群を再帰的に解決し、各 Effect を `(context) => Fn` にする。
 * - `Effect` — 副作用を持つ計算の型表現。4型パラメータ（Service, DirectService, Context, Fn）。
 * - `ResolvedService` — service の各メンバーから service 層を剥がした型。
 * - `FlattenService` — 子 Effect の service を再帰的にフラット化する型。
 * - `DeriveContext` — service の依存から context を自動導出する型。
 * - `ProvideService` — Effect から全依存 service 型を抽出する型。defineRoute の provide で使用。
 * - `ProvideContext` — Effect から context 型を抽出する型。defineRoute の provide で使用。
 * - `DirectServiceOf` — Effect から直接依存 service 型を抽出する型。mockService で使用。
 * - `EffectBrand` — defineEffect の戻り値に付与されるブランド型。
 * - `effectDepsKey` — deps 格納用シンボルキー。
 *
 * ### 使い方
 *
 * ```typescript
 * import type { DbContext } from "@/db"
 * import { defineEffect } from "@/effect"
 * import { defineContract } from "@/contract"
 *
 * // leaf Effect — context のみ
 * export const createUser = defineEffect(
 *   { context: {} as { db: DbContext } },
 *   (context) => defineContract({ ... })
 * )
 *
 * // service + context あり
 * export const postUser = defineEffect(
 *   { service: { createUser } },
 *   (service) => (context) =>
 *     defineRouteContract({
 *       fn: async (input) => {
 *         const result = await service.createUser(context)(input)
 *         // ...
 *       }
 *     })
 * )
 * ```
 */

export type { DeriveContext } from "./DeriveContext"
export type { DirectServiceOf } from "./DirectServiceOf"
export type { Effect } from "./Effect"
export type { EffectBrand } from "./EffectBrand"
export type { FlattenService } from "./FlattenService"
export type { ProvideContext } from "./ProvideContext"
export type { ProvideService } from "./ProvideService"
export type { ResolvedService } from "./ResolvedService"
export type { UnionToIntersection } from "./UnionToIntersection"
export { defineEffect } from "./defineEffect"
export { effectDepsKey } from "./effectDepsKey"
export { resolveEffects } from "./resolveEffects"
