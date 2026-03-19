import type { Desc } from "./Desc"
import type { InputScenarios } from "./InputScenarios"

/**
 * 説明ラベル付きの成功値を生成する。
 *
 * as const の代わりにリテラル型を保持しつつ、
 * Desc ファントム型で説明を型に埋め込む。
 *
 * 第3引数に文字列配列を渡すと、InputScenarios ブランドが付与される。
 * testBehavior の parameterize で、シナリオラベルがパラメータキーとして強制される。
 */
export function okAs<const TDesc extends string, TValue>(
  _desc: TDesc,
  value: TValue,
): Desc<TDesc, { ok: true; value: TValue }>

export function okAs<
  const TDesc extends string,
  TValue,
  const TScenarios extends readonly string[],
>(
  _desc: TDesc,
  value: TValue,
  scenarios: TScenarios,
): InputScenarios<Desc<TDesc, { ok: true; value: TValue }>, TScenarios[number]>

export function okAs(_desc: string, value: unknown, scenarios?: readonly string[]) {
  void scenarios
  return { ok: true as const, value }
}
