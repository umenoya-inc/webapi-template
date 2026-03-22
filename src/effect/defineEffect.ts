import type { DeriveContext } from "./DeriveContext"
import type { Effect } from "./Effect"
import type { EffectBrand } from "./EffectBrand"
import type { FlattenService } from "./FlattenService"
import type { ResolvedService } from "./ResolvedService"
import { effectDepsKey } from "./effectDepsKey"

/* eslint-disable @typescript-eslint/no-explicit-any */

/** 子 Effect を束ねつつ、自身固有の context にも依存するノード。 */
interface NodeEffect<
  Declared extends Record<string, Effect<any, any, any, any>>,
  OwnContext extends Record<string, unknown>,
  Fn,
> extends EffectBrand<
  FlattenService<Declared>,
  Declared,
  OwnContext & DeriveContext<Declared>,
  Fn
> {
  (
    service: ResolvedService<FlattenService<Declared>>,
  ): (context: OwnContext & DeriveContext<Declared>) => Fn
}

/** context のみの leaf Effect。 */
interface LeafEffect<OwnContext extends Record<string, unknown>, Fn> extends EffectBrand<
  {},
  {},
  OwnContext,
  Fn
> {
  (context: OwnContext): Fn
}

/** 子 Effect の合成に徹するノード。自身固有の context は持たない。 */
interface CompositeEffect<
  Declared extends Record<string, Effect<any, any, any, any>>,
  Fn,
> extends EffectBrand<FlattenService<Declared>, Declared, DeriveContext<Declared>, Fn> {
  (service: ResolvedService<FlattenService<Declared>>): (context: DeriveContext<Declared>) => Fn
}

/** Node: 子 Effect + 自身固有の context */
export function defineEffect<
  Declared extends Record<string, Effect<any, any, any, any>>,
  OwnContext extends Record<string, unknown>,
  Fn,
>(
  deps: { service: Declared; context: OwnContext },
  fn: (
    service: ResolvedService<FlattenService<Declared>>,
  ) => (context: OwnContext & DeriveContext<Declared>) => Fn,
): NodeEffect<Declared, OwnContext, Fn>

/** Leaf: context のみ、子 Effect なし */
export function defineEffect<OwnContext extends Record<string, unknown>, Fn>(
  deps: { context: OwnContext },
  fn: (context: OwnContext) => Fn,
): LeafEffect<OwnContext, Fn>

/** Composite: 子 Effect の合成のみ、自身固有の context なし */
export function defineEffect<Declared extends Record<string, Effect<any, any, any, any>>, Fn>(
  deps: { service: Declared },
  fn: (
    service: ResolvedService<FlattenService<Declared>>,
  ) => (context: DeriveContext<Declared>) => Fn,
): CompositeEffect<Declared, Fn>

export function defineEffect(deps: Record<string, unknown>, fn: (...args: any[]) => any): any {
  ;(fn as unknown as Record<symbol, unknown>)[effectDepsKey] = deps
  return fn
}
