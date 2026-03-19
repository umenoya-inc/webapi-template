import type { Desc } from "./Desc"

/**
 * 説明ラベル付きのエラー値を生成する。
 *
 * as const の代わりにリテラル型を保持しつつ、
 * Desc ファントム型で説明を型に埋め込む。
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

export function failAs(_desc: string, reason: string, fields?: Record<string, unknown>) {
  const base = { ok: false as const, reason }
  if (fields) {
    return Object.assign(base, fields)
  }
  return base
}
