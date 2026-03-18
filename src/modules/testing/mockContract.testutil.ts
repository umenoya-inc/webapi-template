/**
 * defineContract ベースの関数に対する振る舞い別モックを定義する。
 *
 * 第1引数は型推論のアンカーとして使う（実行はしない）。
 * 第2引数に variant キーとモック実装を渡す。variant キーは戻り値の union 型から導出され、
 * ok: true → "success"、ok: false → reason の値がキーになる。全 variant の網羅が必須。
 *
 * 各 variant には関数1つ（単一モック）またはオブジェクト（名前付きバリエーション）を指定できる。
 * モック実装は `(input) => Promise<Result>` のシグネチャで、ctx のボイラープレートは不要。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type ContractInner<F> = F extends (...args: any[]) => infer Inner ? Inner : never
type ContractInput<F> = ContractInner<F> extends (input: infer I) => any ? I : never
type ContractResultUnion<F> = ContractInner<F> extends (input: any) => Promise<infer R> ? R : never

type VariantKey<T> = T extends { ok: true }
  ? "success"
  : T extends { ok: false; reason: infer R extends string }
    ? R
    : never

type VariantKeys<F> = VariantKey<ContractResultUnion<F>>

type VariantResult<F, K extends string> = K extends "success"
  ? Extract<ContractResultUnion<F>, { ok: true }>
  : Extract<ContractResultUnion<F>, { ok: false; reason: K }>

type MockFn<F, K extends string> = (input: ContractInput<F>) => Promise<VariantResult<F, K>>

type VariantEntry<F, K extends string> = MockFn<F, K> | Record<string, MockFn<F, K>>

type Behaviors<F> = { [K in VariantKeys<F>]: VariantEntry<F, K> }

type MockReturn<F, B> = {
  [K in keyof B]: B[K] extends (...args: any[]) => any ? F : { [N in keyof B[K]]: F }
}

export const mockContract = <
  F extends (...args: any[]) => (input: any) => Promise<any>,
  B extends Behaviors<F>,
>(
  _fn: F,
  behaviors: B,
): MockReturn<F, B> => {
  const result = {} as Record<string, unknown>
  for (const [key, value] of Object.entries(behaviors)) {
    if (typeof value === "function") {
      result[key] = () => value
    } else {
      const group = {} as Record<string, unknown>
      for (const [name, fn] of Object.entries(value as Record<string, unknown>)) {
        group[name] = () => fn
      }
      result[key] = group
    }
  }
  return result as MockReturn<F, B>
}
