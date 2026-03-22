import { describe, expect, it } from "vite-plus/test"
import { descLabelKey } from "./descLabelKey"
import { okAs } from "./okAs"

describe("okAs", () => {
  it("ok: true と渡されたフィールドを持つオブジェクトを返す", () => {
    const result = okAs("成功", { value: 42 })
    expect(result.ok).toBe(true)
    expect(result.value).toBe(42)
  })

  it("descLabelKey にラベル文字列を保持する", () => {
    const result = okAs("ラベル付き成功", { value: "data" })
    expect((result as Record<symbol, unknown>)[descLabelKey]).toBe("ラベル付き成功")
  })

  it("scenarios 付きオーバーロードでもラベルを正しく保持する", () => {
    const result = okAs(
      { desc: "シナリオ付き成功", scenarios: ["パターンA", "パターンB"] },
      { value: 1 },
    )
    expect(result.ok).toBe(true)
    expect(result.value).toBe(1)
    expect((result as Record<symbol, unknown>)[descLabelKey]).toBe("シナリオ付き成功")
  })
})
