import type { Desc } from "./Desc"
import type { InputScenarios } from "./InputScenarios"

/**
 * 説明ラベル付きのエラー値を生成する。
 *
 * as const の代わりにリテラル型を保持しつつ、
 * Desc ファントム型で説明を型に埋め込む。
 *
 * 最終引数に文字列配列を渡すと、InputScenarios ブランドが付与される。
 * testBehavior の parameterize で、シナリオラベルがパラメータキーとして強制される。
 */
export function failAs<TDesc extends string, TReason extends string>(
  _desc: TDesc,
  reason: TReason,
): Desc<TDesc, { ok: false; reason: TReason }>

export function failAs<
  TDesc extends string,
  TReason extends string,
  const TScenarios extends readonly string[],
>(
  _desc: TDesc,
  reason: TReason,
  scenarios: TScenarios,
): InputScenarios<Desc<TDesc, { ok: false; reason: TReason }>, TScenarios[number]>

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
  const TFields extends Record<string, unknown>,
  const TScenarios extends readonly string[],
>(
  _desc: TDesc,
  reason: TReason,
  fields: TFields,
  scenarios: TScenarios,
): InputScenarios<Desc<TDesc, { ok: false; reason: TReason } & TFields>, TScenarios[number]>

export function failAs(
  _desc: string,
  reason: string,
  fieldsOrScenarios?: Record<string, unknown> | readonly string[],
  scenarios?: readonly string[],
) {
  const fields = Array.isArray(fieldsOrScenarios) ? undefined : fieldsOrScenarios
  const base = { ok: false as const, reason }
  void scenarios
  if (fields) {
    return Object.assign(base, fields)
  }
  return base
}
