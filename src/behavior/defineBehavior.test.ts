import { describe, expect, it } from "vite-plus/test"
import { defineBehavior } from "./defineBehavior"
import { failAs } from "./failAs"
import { okAs } from "./okAs"

describe("defineBehavior", () => {
  it("関数をそのまま返す（ランタイムコストゼロ）", () => {
    const fn = async () => okAs("成功", { value: 1 })
    const behavior = defineBehavior(fn)
    expect(behavior).toBe(fn)
  })

  it("ブランド付きの関数が正しく呼び出せる", async () => {
    const findUser = defineBehavior(async (input: { id: string }) => {
      if (input.id === "1") {
        return okAs("ユーザーを取得", { value: { id: "1", name: "Alice" } })
      }
      return failAs("ユーザーが存在しない", "not_found")
    })

    const ok = await findUser({ id: "1" })
    expect(ok.ok).toBe(true)

    const notFound = await findUser({ id: "999" })
    expect(notFound.ok).toBe(false)
  })
})
