import type { EffectBrand } from "./EffectBrand"

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Effect から全依存 service 型を抽出する。defineRoute の provide で使用。 */
export type ProvideService<E> = E extends EffectBrand<infer S, any, any, any> ? S : never
