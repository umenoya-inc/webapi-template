/**
 * @packageDocumentation
 * ## effect モジュール
 *
 * 軽量 Effect System。`defineEffect` で副作用を持つ計算を定義し、
 * 依存の自動合成と副作用の型レベル明示を実現する。
 *
 * ### Effect のツリー構造
 *
 * Effect は依存関係によりツリーを形成する。ノードは3種類。
 *
 * ```
 * NodeEffect (getUserById)            ← 子 Effect + 自身固有の context (auth)
 * └── LeafEffect (findUserById)       ← context のみ (db)
 *
 * CompositeEffect (postUser)          ← 子 Effect の合成のみ
 * └── LeafEffect (createUser)         ← context のみ (db)
 *
 * LeafEffect (listUsers)              ← context のみ (db)
 * ```
 *
 * | 種類              | 子 Effect | 自身の context | 呼び出しシグネチャ             |
 * |-------------------|-----------|---------------|-------------------------------|
 * | `LeafEffect`      | なし      | あり          | `(context) => Fn`             |
 * | `CompositeEffect` | あり      | なし          | `(service) => (context) => Fn` |
 * | `NodeEffect`      | あり      | あり          | `(service) => (context) => Fn` |
 *
 * ### EffectBrand の型パラメータ
 *
 * 全 Effect は `EffectBrand<Service, DirectService, Context, Fn>` を持つ。
 *
 * - `Service` — ツリー全体をフラット化した依存（`FlattenService` で導出）
 * - `DirectService` — 直接の子 Effect のみ（`mockService` で使用）
 * - `Context` — 必要な context の合成型（子の依存 + 自身固有の context）
 * - `Fn` — Effect が返す関数の型（通常は Contract）
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
 * import { requiredContext, defineEffect } from "@/effect"
 * import { defineContract } from "@/contract"
 *
 * // Leaf: context のみ
 * export const createUser = defineEffect(
 *   { context: requiredContext<{ db: DbContext }>() },
 *   (context) => defineContract({ ... })
 * )
 *
 * // Composite: 子 Effect の合成のみ
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
export { EffectChainError } from "./EffectChainError"
export type { EffectTrace } from "./EffectTrace"
export { requiredContext } from "./requiredContext"
export { defineEffect } from "./defineEffect"
export { effectDepsKey } from "./effectDepsKey"
export { resolveEffects } from "./resolveEffects"
