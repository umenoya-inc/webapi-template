import type { Desc } from "./Desc"
import type { InputScenarios } from "./InputScenarios"
import { descLabelKey } from "./descLabelKey"

/**
 * 説明ラベル付きのエラー値を生成する。
 *
 * as const の代わりにリテラル型を保持しつつ、
 * Desc ファントム型で説明を型に埋め込む。
 *
 * 第1引数にオブジェクト `{ desc, scenarios }` を渡すと、InputScenarios ブランドが付与される。
 * testBehavior の parameterize で、シナリオラベルがパラメータキーとして強制される。
 */
export function failAs<TDesc extends string, TReason extends string>(
  _desc: TDesc,
  reason: TReason,
): Desc<TDesc, { ok: false; reason: TReason }>

export function failAs<
  TDesc extends string,
  TReason extends string,
  const TFields extends Record<string, unknown>,
>(
  _desc: TDesc,
  reason: TReason,
  fields: TFields,
): Desc<TDesc, { ok: false; reason: TReason } & TFields>

export function failAs<
  TDesc extends string,
  TReason extends string,
  const TScenarios extends readonly string[],
>(
  _desc: { desc: TDesc; scenarios: TScenarios },
  reason: TReason,
): InputScenarios<Desc<TDesc, { ok: false; reason: TReason }>, TScenarios[number]>

export function failAs<
  TDesc extends string,
  TReason extends string,
  const TFields extends Record<string, unknown>,
  const TScenarios extends readonly string[],
>(
  _desc: { desc: TDesc; scenarios: TScenarios },
  reason: TReason,
  fields: TFields,
): InputScenarios<Desc<TDesc, { ok: false; reason: TReason } & TFields>, TScenarios[number]>

export function failAs(
  _desc: string | { desc: string; scenarios: readonly string[] },
  reason: string,
  fields?: Record<string, unknown>,
) {
  const label = typeof _desc === "string" ? _desc : _desc.desc
  const base: Record<string | symbol, unknown> = { ok: false, [descLabelKey]: label, reason }
  if (fields) {
    return Object.assign(base, fields)
  }
  return base
}
