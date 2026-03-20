/** Effect チェーン内で発生したエラーに Effect 名の経路情報・入力値・実行時間を付与するエラークラス。 */
export class EffectChainError extends Error {
  readonly chain: string[]
  readonly inputs: Record<string, unknown>
  readonly durations: Record<string, number>

  constructor(effectName: string, input: unknown, durationMs: number, cause: unknown) {
    const innerChain = cause instanceof EffectChainError ? cause.chain : []
    const innerInputs = cause instanceof EffectChainError ? cause.inputs : {}
    const innerDurations = cause instanceof EffectChainError ? cause.durations : {}
    const chain = [effectName, ...innerChain]
    const inputs = { [effectName]: input, ...innerInputs }
    const durations = { [effectName]: durationMs, ...innerDurations }
    const originalCause = cause instanceof EffectChainError ? cause.cause : cause
    const originalMessage =
      originalCause instanceof Error ? originalCause.message : String(originalCause)
    super(`Effect chain [${chain.join(" → ")}]: ${originalMessage}`, { cause: originalCause })
    this.name = "EffectChainError"
    this.chain = chain
    this.inputs = inputs
    this.durations = durations
  }
}
