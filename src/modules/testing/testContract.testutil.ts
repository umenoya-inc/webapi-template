/**
 * defineContract ベースの関数に対する振る舞い別テストを網羅的に定義する。
 *
 * 第1引数は型推論のアンカーとして使う（実行はしない）。
 * 第2引数に Desc ラベルとテストケースを渡す。ラベルは戻り値の Desc 型から導出され、
 * 全ラベルの網羅が必須。
 *
 * 各テストケースは assert 関数を受け取る。assert(result) を呼ぶと:
 * - 検証済みの result を該当 variant の型に絞り込んで返す
 * - assert を呼ばなかった場合、テストは失敗する
 *
 * テストケースの形式:
 * - テスト関数: `async (assert) => { ... }`
 * - 名前付き複数テスト: `{ "テスト名": async (assert) => { ... }, ... }`
 * - env 宣言付き: `{ env: { ... }, test: async (env, assert) => { ... } }`
 * - env 宣言 + 名前付き: `{ env: { ... }, test: { "テスト名": async (env, assert) => { ... } } }`
 */

import { expect, it } from "vite-plus/test"
import type { DescLabel, ExtractByLabel } from "@/modules/contract"

/* eslint-disable @typescript-eslint/no-explicit-any */

type ContractInner<F> = F extends (...args: any[]) => infer Inner ? Inner : never
type ContractResultUnion<F> =
  ContractInner<F> extends (...args: any[]) => Promise<infer R> ? R : never

type Labels<F> = DescLabel<ContractResultUnion<F>>

/** Desc ブランド（symbol キー）を剥がして素のオブジェクト型にする */
type StripBrand<T> = { [K in keyof T as K extends string ? K : never]: T[K] }

type LabelResult<F, K extends string> = StripBrand<ExtractByLabel<ContractResultUnion<F>, K>>

type LabelAssert<F, K extends string> = (result: ContractResultUnion<F>) => LabelResult<F, K>

/** Contract 関数の第2引数（env）の型を抽出する。env がなければ never */
type ContractEnv<F> = F extends (ctx: any, env: infer E) => any ? E : never

type TestFn<F, K extends string> = (assert: LabelAssert<F, K>) => Promise<void> | void

type ScenarioTestFn<F, K extends string> = (
  env: ContractEnv<F>,
  assert: LabelAssert<F, K>,
) => Promise<void> | void

type ScenarioEntry<F, K extends string> = {
  env: ContractEnv<F>
  test: ScenarioTestFn<F, K> | Record<string, ScenarioTestFn<F, K>>
}

type LabelTestEntry<F, K extends string> =
  | TestFn<F, K>
  | Record<string, TestFn<F, K>>
  | ScenarioEntry<F, K>

type TestCases<F> = { [K in Labels<F>]: LabelTestEntry<F, K> }

export const testContract = <F extends (...args: any[]) => (...args: any[]) => Promise<any>>(
  _fn: F,
  cases: TestCases<F>,
): void => {
  for (const [key, value] of Object.entries(cases)) {
    if (typeof value === "function") {
      it(key, wrapTest(value as TestFn<F, string>))
    } else if (typeof value === "object" && value !== null && "env" in value && "test" in value) {
      const scenario = value as { env: any; test: any }
      if (typeof scenario.test === "function") {
        it(key, wrapScenarioTest(scenario.env, scenario.test))
      } else {
        for (const [name, fn] of Object.entries(scenario.test as Record<string, any>)) {
          it(`${key}: ${name}`, wrapScenarioTest(scenario.env, fn as any))
        }
      }
    } else {
      for (const [name, fn] of Object.entries(value as Record<string, TestFn<F, string>>)) {
        it(`${key}: ${name}`, wrapTest(fn))
      }
    }
  }
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

function wrapScenarioTest<F>(env: any, fn: ScenarioTestFn<F, string>): () => Promise<void> {
  return async () => {
    let asserted = false
    const assert = (result: any) => {
      asserted = true
      return result
    }
    await fn(env, assert as any)
    if (!asserted) {
      expect.unreachable(
        `assert() が呼ばれていません。テスト内で assert(result) を呼んで variant を検証してください。`,
      )
    }
  }
}
