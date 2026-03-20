import type { EffectBrand } from "./EffectBrand"
import type { FlattenService } from "./FlattenService"
import type { UnionToIntersection } from "./UnionToIntersection"

/* eslint-disable @typescript-eslint/no-explicit-any */

type AnyEffect = ((...args: any[]) => any) & EffectBrand<any, any, any, any>

/** service の依存から context を自動導出する。 */
export type DeriveContext<Service extends Record<string, AnyEffect>> = UnionToIntersection<
  {
    [K in keyof FlattenService<Service>]: FlattenService<Service>[K] extends EffectBrand<
      any,
      any,
      infer C,
      any
    >
      ? C
      : never
  }[keyof FlattenService<Service>]
> &
  Record<string, unknown>
