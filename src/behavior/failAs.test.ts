import { describe, expect, it } from "vite-plus/test"
import { descLabelKey } from "./descLabelKey"
import { failAs } from "./failAs"

describe("failAs", () => {
  it("ok: false と reason を持つオブジェクトを返す", () => {
    const result = failAs("失敗", "not_found")
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("not_found")
  })

  it("descLabelKey にラベル文字列を保持する", () => {
    const result = failAs("ラベル付き失敗", "validation_failed")
    expect((result as Record<symbol, unknown>)[descLabelKey]).toBe("ラベル付き失敗")
  })

  it("追加フィールドを含められる", () => {
    const result = failAs("詳細付き失敗", "duplicate_entry", { field: "email" })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("duplicate_entry")
    expect(result.field).toBe("email")
  })

  it("scenarios 付きオーバーロードでもラベルを正しく保持する", () => {
    const result = failAs(
      { desc: "シナリオ付き失敗", scenarios: ["パターンA"] },
      "validation_failed",
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("validation_failed")
    expect((result as Record<symbol, unknown>)[descLabelKey]).toBe("シナリオ付き失敗")
  })
})
