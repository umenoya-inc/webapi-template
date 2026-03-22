/** Effect の実行トレース。各 Effect の名前・入力・実行時間を記録する。 */
export interface EffectTrace {
  effect: string
  input: unknown
  durationMs: number
}
