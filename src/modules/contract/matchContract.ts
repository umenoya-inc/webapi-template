/**
 * Contract 関数の戻り値に対する exhaustive なパターンマッチを提供する。
 *
 * variant キーは戻り値の union 型から導出され、全 variant の網羅が必須。
 * 各ハンドラは該当 variant に絞り込まれた型を受け取る。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type VariantKey<T> = T extends { ok: true }
  ? "success"
  : T extends { ok: false; reason: infer R extends string }
    ? R
    : never

type VariantResult<TResult, K extends string> = K extends "success"
  ? Extract<TResult, { ok: true }>
  : Extract<TResult, { ok: false; reason: K }>

type Handlers<TResult, TReturn> = {
  [K in VariantKey<TResult>]: (result: VariantResult<TResult, K>) => TReturn
}

export const matchContract = <TResult extends { ok: boolean }, TReturn>(
  result: TResult,
  handlers: Handlers<TResult, TReturn>,
): TReturn => {
  if ((result as any).ok) {
    return (handlers as any).success(result)
  }
  const reason = (result as any).reason as string
  const handler = (handlers as any)[reason]
  if (!handler) {
    throw new Error(`Unhandled contract variant: ${reason}`)
  }
  return handler(result)
}
