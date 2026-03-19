import type { Desc } from "./Desc"

/** Desc ラベルで union メンバーを抽出する。 */
export type ExtractByLabel<T, L extends string> = Extract<T, Desc<L, unknown>>
