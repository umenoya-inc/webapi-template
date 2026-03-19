/**
 * defineBehavior / defineContract ベースの関数に対する振る舞い別モックを定義する。
 *
 * 第1引数は型推論のアンカーとして使う（実行はしない）。
 * 第2引数に Desc ラベルとモック実装を渡す。ラベルは戻り値の Desc 型から導出され、
 * 全ラベルの網羅が必須。
 *
 * 各ラベルには関数1つ（単一モック）またはオブジェクト（名前付きバリエーション）を指定できる。
 * モック実装は `(input) => Promise<Result>` のシグネチャで、ctx のボイラープレートは不要。
 * 戻り値は Desc ブランドなしの素のオブジェクトで記述できる。
 */

import type { BehaviorBrand, DescLabel, ExtractByLabel } from "@/behavior"

/* eslint-disable @typescript-eslint/no-explicit-any */

/** BehaviorBrand を再帰的に探して Result 型を抽出する */
type ExtractBehaviorResult<T> = T extends BehaviorBrand & ((...args: any[]) => Promise<infer R>)
  ? R
  : T extends (...args: any[]) => infer Inner
    ? ExtractBehaviorResult<Inner>
    : never

type BehaviorResult<F> = ExtractBehaviorResult<F>

/** BehaviorBrand を再帰的に探して内側の関数の input 型を抽出する */
type ExtractBehaviorInput<T> = T extends BehaviorBrand & ((input: infer I) => any)
  ? I
  : T extends (...args: any[]) => infer Inner
    ? ExtractBehaviorInput<Inner>
    : never

type BehaviorInput<F> = ExtractBehaviorInput<F>

type Labels<F> = DescLabel<BehaviorResult<F>>

/** Desc ブランド（symbol キー）を剥がして素のオブジェクト型にする */
type StripBrand<T> = { [K in keyof T as K extends string ? K : never]: T[K] }

type LabelResult<F, K extends string> = StripBrand<ExtractByLabel<BehaviorResult<F>, K>>

type MockFn<F, K extends string> = [BehaviorInput<F>] extends [never]
  ? () => Promise<LabelResult<F, K>>
  : (input: BehaviorInput<F>) => Promise<LabelResult<F, K>>

type LabelEntry<F, K extends string> = MockFn<F, K> | Record<string, MockFn<F, K>>

type Behaviors<F> = { [K in Labels<F>]: LabelEntry<F, K> }

type MockReturn<F, B> = {
  [K in keyof B]: B[K] extends (...args: any[]) => any ? F : { [N in keyof B[K]]: F }
}

export const mockBehavior = <F extends (...args: any[]) => any, B extends Behaviors<F>>(
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
