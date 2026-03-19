/**
 * defineBehavior / defineContract ベースの関数に対する振る舞い別テストを網羅的に定義する。
 *
 * 第1引数は型推論のアンカーとして使う（実行はしない）。
 * 第2引数に Desc ラベルとテストケースを渡す。ラベルは戻り値の Desc 型から導出され、
 * 全ラベルの網羅が必須。
 *
 * 各テストケースは assert 関数を受け取る。assert(result) を呼ぶと:
 * - 検証済みの result を該当 variant の型に絞り込んで返す
 * - assert を呼ばなかった場合、テストは失敗する
 *
 * 各ラベルにはテスト関数1つ（単一テスト）またはオブジェクト（名前付き複数テスト）を指定できる。
 */

import { expect, it } from "vite-plus/test"
import type { BehaviorBrand, DescLabel, ExtractByLabel, ExtractInputScenarios } from "@/behavior"

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

type LabelAssert<F, K extends string> = (result: BehaviorResult<F>) => LabelResult<F, K>

type TestFn<F, K extends string> = (assert: LabelAssert<F, K>) => Promise<void> | void

/** ラベルに対応するシナリオ文字列を抽出する。未宣言の場合は string にフォールバック */
type Scenarios<F, K extends string> = [ExtractInputScenarios<BehaviorResult<F>, K>] extends [never]
  ? string
  : ExtractInputScenarios<BehaviorResult<F>, K>

/** パラメタライズドテストエントリの構造型 */
type ParameterizedTestEntry<F, K extends string> = {
  __parameterize: true
  params: Record<Scenarios<F, K>, BehaviorInput<F>>
  test: (assert: LabelAssert<F, K>, param: BehaviorInput<F>) => Promise<void> | void
}

type LabelTestEntry<F, K extends string> =
  | TestFn<F, K>
  | Record<string, TestFn<F, K>>
  | ParameterizedTestEntry<F, K>

type TestCases<F> = { [K in Labels<F>]: LabelTestEntry<F, K> }

export const testBehavior = <F extends (...args: any[]) => any>(
  _fn: F,
  cases: TestCases<F>,
): void => {
  for (const [key, value] of Object.entries(cases)) {
    if (typeof value === "function") {
      it(key, wrapTest(value as TestFn<F, string>))
    } else if (isParameterized(value)) {
      for (const [name, param] of Object.entries(value.params)) {
        it(`${key}: ${name}`, wrapParamTest(value.test, param))
      }
    } else {
      for (const [name, fn] of Object.entries(value as Record<string, TestFn<F, string>>)) {
        it(`${key}: ${name}`, wrapTest(fn))
      }
    }
  }
}

function isParameterized(value: unknown): value is {
  __parameterize: true
  params: Record<string, unknown>
  test: (...args: any[]) => any
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "__parameterize" in value &&
    (value as any).__parameterize === true
  )
}

function wrapTest<F>(fn: TestFn<F, string>): () => Promise<void> {
  return async () => {
    let asserted = false
    const assert = (result: any) => {
      asserted = true
      return result
    }
    await fn(assert as any)
    if (!asserted) {
      expect.unreachable(
        `assert() が呼ばれていません。テスト内で assert(result) を呼んで variant を検証してください。`,
      )
    }
  }
}

function wrapParamTest(
  fn: (assert: any, param: any) => Promise<void> | void,
  param: unknown,
): () => Promise<void> {
  return async () => {
    let asserted = false
    const assert = (result: any) => {
      asserted = true
      return result
    }
    await fn(assert, param)
    if (!asserted) {
      expect.unreachable(
        `assert() が呼ばれていません。テスト内で assert(result) を呼んで variant を検証してください。`,
      )
    }
  }
}
