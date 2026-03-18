/**
 * defineContract ベースの関数に対する振る舞い別テストを網羅的に定義する。
 *
 * 第1引数は型推論のアンカーとして使う（実行はしない）。
 * 第2引数に variant キーとテストケースを渡す。variant キーは戻り値の union 型から導出され、
 * ok: true → "success"、ok: false → reason の値がキーになる。全 variant の網羅が必須。
 *
 * 各テストケースは assert 関数を受け取る。assert(result) を呼ぶと:
 * - result が該当 variant に一致するか検証する
 * - 検証済みの result を variant の型に絞り込んで返す
 * - assert を呼ばなかった場合、テストは失敗する
 *
 * 各 variant にはテスト関数1つ（単一テスト）またはオブジェクト（名前付き複数テスト）を指定できる。
 */

import { expect, it } from "vite-plus/test"

/* eslint-disable @typescript-eslint/no-explicit-any */

type ContractInner<F> = F extends (...args: any[]) => infer Inner ? Inner : never
type ContractResultUnion<F> =
  ContractInner<F> extends (...args: any[]) => Promise<infer R> ? R : never

type VariantKey<T> = T extends { ok: true }
  ? "success"
  : T extends { ok: false; reason: infer R extends string }
    ? R
    : never

type VariantKeys<F> = VariantKey<ContractResultUnion<F>>

type VariantResult<F, K extends string> = K extends "success"
  ? Extract<ContractResultUnion<F>, { ok: true }>
  : Extract<ContractResultUnion<F>, { ok: false; reason: K }>

type VariantAssert<F, K extends string> = (result: ContractResultUnion<F>) => VariantResult<F, K>

type TestFn<F, K extends string> = (assert: VariantAssert<F, K>) => Promise<void> | void

type VariantTestEntry<F, K extends string> = TestFn<F, K> | Record<string, TestFn<F, K>>

type TestCases<F> = { [K in VariantKeys<F>]: VariantTestEntry<F, K> }

export const testContract = <F extends (...args: any[]) => (...args: any[]) => Promise<any>>(
  _fn: F,
  cases: TestCases<F>,
): void => {
  for (const [key, value] of Object.entries(cases)) {
    if (typeof value === "function") {
      it(key, wrapTest(key, value as TestFn<F, string>))
    } else {
      for (const [name, fn] of Object.entries(value as Record<string, TestFn<F, string>>)) {
        it(`${key}: ${name}`, wrapTest(key, fn))
      }
    }
  }
}

function wrapTest<F>(key: string, fn: TestFn<F, string>): () => Promise<void> {
  return async () => {
    let asserted = false
    const assert = (result: any) => {
      asserted = true
      if (key === "success") {
        expect(result.ok).toBe(true)
      } else {
        expect(result.ok).toBe(false)
        expect(result.reason).toBe(key)
      }
      return result
    }
    await fn(assert as any)
    if (!asserted) {
      expect.unreachable(
        `assert() が呼ばれていません。テスト内で assert(result) を呼んで variant "${key}" を検証してください。`,
      )
    }
  }
}
