import type { EffectBrand } from "./EffectBrand"

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Effect から context 型を抽出する。defineRoute の provide で使用。 */
export type ProvideContext<E> = E extends EffectBrand<any, any, infer C, any> ? C : never
