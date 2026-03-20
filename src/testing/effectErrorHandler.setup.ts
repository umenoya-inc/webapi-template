import { afterEach } from "vite-plus/test"

/** テスト失敗時に EffectChainError の inputs を表示する。 */
afterEach(({ task }) => {
  const errors = task.result?.errors
  if (!errors) return
  for (const error of errors) {
    if (error.name !== "EffectChainError") continue
    const { chain, inputs } = error as { chain?: string[]; inputs?: Record<string, unknown> }
    if (chain) {
      console.log(`\n  Effect chain: ${chain.join(" → ")}`)
    }
    if (inputs) {
      console.log("  Effect inputs:")
      for (const [name, input] of Object.entries(inputs)) {
        console.log(`    ${name}: ${JSON.stringify(input)}`)
      }
    }
  }
})
