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
import type { BehaviorBrand, DescLabel, ExtractByLabel } from "@/behavior"

/* eslint-disable @typescript-eslint/no-explicit-any */

/** BehaviorBrand を再帰的に探して Result 型を抽出する */
type ExtractBehaviorResult<T> = T extends BehaviorBrand & ((...args: any[]) => Promise<infer R>)
  ? R
  : T extends (...args: any[]) => infer Inner
    ? ExtractBehaviorResult<Inner>
    : never

type BehaviorResult<F> = ExtractBehaviorResult<F>

type Labels<F> = DescLabel<BehaviorResult<F>>

/** Desc ブランド（symbol キー）を剥がして素のオブジェクト型にする */
type StripBrand<T> = { [K in keyof T as K extends string ? K : never]: T[K] }

type LabelResult<F, K extends string> = StripBrand<ExtractByLabel<BehaviorResult<F>, K>>

type LabelAssert<F, K extends string> = (result: BehaviorResult<F>) => LabelResult<F, K>

type TestFn<F, K extends string> = (assert: LabelAssert<F, K>) => Promise<void> | void

type LabelTestEntry<F, K extends string> = TestFn<F, K> | Record<string, TestFn<F, K>>

type TestCases<F> = { [K in Labels<F>]: LabelTestEntry<F, K> }

export const testBehavior = <F extends (...args: any[]) => any>(
  _fn: F,
  cases: TestCases<F>,
): void => {
  for (const [key, value] of Object.entries(cases)) {
    if (typeof value === "function") {
      it(key, wrapTest(value as TestFn<F, string>))
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
