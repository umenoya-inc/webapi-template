/** Effect チェーン内で発生したエラーに Effect 名の経路情報を付与するエラークラス。 */
export class EffectChainError extends Error {
  readonly chain: string[]

  constructor(effectName: string, cause: unknown) {
    const innerChain = cause instanceof EffectChainError ? cause.chain : []
    const chain = [effectName, ...innerChain]
    const originalCause = cause instanceof EffectChainError ? cause.cause : cause
    const originalMessage =
      originalCause instanceof Error ? originalCause.message : String(originalCause)
    super(`Effect chain [${chain.join(" → ")}]: ${originalMessage}`, { cause: originalCause })
    this.name = "EffectChainError"
    this.chain = chain
  }
}
