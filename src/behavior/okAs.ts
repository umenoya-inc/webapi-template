import type { Desc } from "./Desc"
import type { InputScenarios } from "./InputScenarios"
import { descLabelKey } from "./descLabelKey"

/**
 * 説明ラベル付きの成功値を生成する。
 *
 * as const の代わりにリテラル型を保持しつつ、
 * Desc ファントム型で説明を型に埋め込む。
 *
 * 第1引数にオブジェクト `{ desc, scenarios }` を渡すと、InputScenarios ブランドが付与される。
 * testBehavior の parameterize で、シナリオラベルがパラメータキーとして強制される。
 */
export function okAs<const TDesc extends string, TFields extends Record<string, unknown>>(
  _desc: TDesc,
  fields: TFields,
): Desc<TDesc, { ok: true } & TFields>

export function okAs<
  const TDesc extends string,
  TFields extends Record<string, unknown>,
  const TScenarios extends readonly string[],
>(
  _desc: { desc: TDesc; scenarios: TScenarios },
  fields: TFields,
): InputScenarios<Desc<TDesc, { ok: true } & TFields>, TScenarios[number]>

export function okAs(
  _desc: string | { desc: string; scenarios: readonly string[] },
  fields: Record<string, unknown>,
) {
  const label = typeof _desc === "string" ? _desc : _desc.desc
  return { ok: true, [descLabelKey]: label, ...fields } as { ok: true } & typeof fields
}
