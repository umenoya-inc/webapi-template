import type { EffectBrand } from "./EffectBrand"

/* eslint-disable @typescript-eslint/no-explicit-any */

type AnyEffect = ((...args: any[]) => any) & EffectBrand<any, any, any, any>

/** service の各メンバーから service 層を剥がし、`(context) => Fn` の形にする。 */
export type ResolvedService<Service extends Record<string, AnyEffect>> = {
  [K in keyof Service]: Service[K] extends EffectBrand<any, any, infer C, infer F>
    ? (context: C) => F
    : never
}
