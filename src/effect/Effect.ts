import type { EffectBrand } from "./EffectBrand"

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 副作用を持つ計算の型表現。service / context / fn 型を型パラメータとして保持する。
 *
 * leaf Effect（service なし）は `(context) => Fn`、non-leaf は `(service) => (context) => Fn` の呼び出しシグネチャを持つ。
 * EffectBrand で4型パラメータを保持し、ProvideService / ProvideContext / DirectServiceOf 等で型抽出可能。
 */
export type Effect<
  Service extends Record<string, Effect<any, any, any, any>>,
  DirectService extends Record<string, Effect<any, any, any, any>>,
  Context extends Record<string, unknown>,
  Fn,
> = ((...args: any[]) => any) & EffectBrand<Service, DirectService, Context, Fn>
