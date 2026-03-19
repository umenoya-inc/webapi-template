import type { Desc } from "./Desc"

/**
 * 説明ラベル付きの成功値を生成する。
 *
 * as const の代わりにリテラル型を保持しつつ、
 * Desc ファントム型で説明を型に埋め込む。
 */
export function okAs<TDesc extends string, TValue>(
  _desc: TDesc,
  value: TValue,
): Desc<TDesc, { ok: true; value: TValue }> {
  return { ok: true as const, value } as Desc<TDesc, { ok: true; value: TValue }>
}
