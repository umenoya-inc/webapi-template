import type { EffectBrand } from "./EffectBrand"

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Effect から直接依存 service 型を抽出する。mockService で使用。 */
export type DirectServiceOf<E> = E extends EffectBrand<any, infer D, any, any> ? D : never
