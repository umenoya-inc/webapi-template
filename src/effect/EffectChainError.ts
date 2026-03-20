/** Effect チェーン内で発生したエラーに Effect 名の経路情報と入力値を付与するエラークラス。 */
export class EffectChainError extends Error {
  readonly chain: string[]
  readonly inputs: Record<string, unknown>

  constructor(effectName: string, input: unknown, cause: unknown) {
    const innerChain = cause instanceof EffectChainError ? cause.chain : []
    const innerInputs = cause instanceof EffectChainError ? cause.inputs : {}
    const chain = [effectName, ...innerChain]
    const inputs = { [effectName]: input, ...innerInputs }
    const originalCause = cause instanceof EffectChainError ? cause.cause : cause
    const originalMessage =
      originalCause instanceof Error ? originalCause.message : String(originalCause)
    super(`Effect chain [${chain.join(" → ")}]: ${originalMessage}`, { cause: originalCause })
    this.name = "EffectChainError"
    this.chain = chain
    this.inputs = inputs
  }
}
