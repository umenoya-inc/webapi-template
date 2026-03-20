import type { EffectBrand } from "./EffectBrand"
import type { UnionToIntersection } from "./UnionToIntersection"

/* eslint-disable @typescript-eslint/no-explicit-any */

type AnyEffect = ((...args: any[]) => any) & EffectBrand<any, any, any, any>

/** 子 Effect の service を再帰的にフラット化する。 */
export type FlattenService<Declared extends Record<string, AnyEffect>> = Declared &
  UnionToIntersection<
    {
      [K in keyof Declared]: Declared[K] extends EffectBrand<infer ChildService, any, any, any>
        ? ChildService extends Record<string, AnyEffect>
          ? FlattenService<ChildService>
          : {}
        : {}
    }[keyof Declared]
  >
