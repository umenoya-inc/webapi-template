import { afterEach } from "vite-plus/test"

/** テスト失敗時に EffectChainError の詳細情報を表示する。 */
afterEach(({ task }) => {
  const errors = task.result?.errors
  if (!errors) return
  for (const error of errors) {
    if (error.name !== "EffectChainError") continue
    const { chain, inputs, durations } = error as {
      chain?: string[]
      inputs?: Record<string, unknown>
      durations?: Record<string, number>
    }
    if (chain) {
      console.log(`\n  Effect chain: ${chain.join(" → ")}`)
    }
    if (inputs) {
      console.log("  Effect inputs:")
      for (const [name, input] of Object.entries(inputs)) {
        console.log(`    ${name}: ${JSON.stringify(input)}`)
      }
    }
    if (durations) {
      console.log("  Effect durations:")
      for (const [name, ms] of Object.entries(durations)) {
        console.log(`    ${name}: ${Math.round(ms * 100) / 100}ms`)
      }
    }
  }
})
