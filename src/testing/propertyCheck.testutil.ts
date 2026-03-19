/**
 * 同じ振る舞いパスに対してプロパティベーステストを定義する。
 *
 * testBehavior の各ラベルに渡すことで、params の各エントリごとに
 * fast-check のプロパティテストが実行される。
 *
 * params の値は Valibot スキーマから自動生成される arbitrary に対する
 * フィールド単位のオーバーライド。指定しないフィールドはスキーマから導出される。
 */

import type { Arbitrary } from "fast-check"

/* eslint-disable @typescript-eslint/no-explicit-any */

export function propertyCheck<TKeys extends string>(
  fn: (...args: any[]) => any,
  params: Record<TKeys, Record<string, Arbitrary<any>>>,
  test: (assert: (result: any) => unknown, input: any) => Promise<void> | void,
): {
  __propertyCheck: true
  fn: (...args: any[]) => any
  params: Record<TKeys, Record<string, Arbitrary<any>>>
  test: typeof test
} {
  return { __propertyCheck: true, fn, params, test }
}
