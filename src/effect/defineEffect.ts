import type { DeriveContext } from "./DeriveContext"
import type { Effect } from "./Effect"
import type { EffectBrand } from "./EffectBrand"
import type { FlattenService } from "./FlattenService"
import type { ResolvedService } from "./ResolvedService"
import { effectDepsKey } from "./effectDepsKey"

/* eslint-disable @typescript-eslint/no-explicit-any */

/** service + context あり */
export function defineEffect<
  Declared extends Record<string, Effect<any, any, any, any>>,
  OwnContext extends Record<string, unknown>,
  Fn,
>(
  deps: { service: Declared; context: OwnContext },
  fn: (
    service: ResolvedService<FlattenService<Declared>>,
  ) => (context: OwnContext & DeriveContext<Declared>) => Fn,
): ((
  service: ResolvedService<FlattenService<Declared>>,
) => (context: OwnContext & DeriveContext<Declared>) => Fn) &
  EffectBrand<FlattenService<Declared>, Declared, OwnContext & DeriveContext<Declared>, Fn>

/** context のみ（leaf Effect） */
export function defineEffect<OwnContext extends Record<string, unknown>, Fn>(
  deps: { context: OwnContext },
  fn: (context: OwnContext) => Fn,
): ((context: OwnContext) => Fn) & EffectBrand<{}, {}, OwnContext, Fn>

/** service のみ（自分固有の context なし） */
export function defineEffect<Declared extends Record<string, Effect<any, any, any, any>>, Fn>(
  deps: { service: Declared },
  fn: (
    service: ResolvedService<FlattenService<Declared>>,
  ) => (context: DeriveContext<Declared>) => Fn,
): ((
  service: ResolvedService<FlattenService<Declared>>,
) => (context: DeriveContext<Declared>) => Fn) &
  EffectBrand<FlattenService<Declared>, Declared, DeriveContext<Declared>, Fn>

export function defineEffect(deps: Record<string, unknown>, fn: (...args: any[]) => any): any {
  ;(fn as unknown as Record<symbol, unknown>)[effectDepsKey] = deps
  return fn
}
