import type { Desc } from "./Desc"

/** Desc ブランドからラベル文字列を抽出する。union に分配される。 */
export type DescLabel<T> = T extends Desc<infer L, unknown> ? L : never
