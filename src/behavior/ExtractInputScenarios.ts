import type { Desc } from "./Desc"
import type { InputScenarios } from "./InputScenarios"

/** Desc ラベルに対応する InputScenarios のシナリオ文字列を抽出する。 */
export type ExtractInputScenarios<T, L extends string> =
  Extract<T, Desc<L, unknown>> extends InputScenarios<unknown, infer S> ? S : never
