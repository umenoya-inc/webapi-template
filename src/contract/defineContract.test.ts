import { object, pipe, string, minLength } from "valibot"
import { describe, expect, it } from "vite-plus/test"
import { okAs, failAs } from "@/behavior"
import { defaultInputError } from "./defaultInputError"
import { defineContract } from "./defineContract"

describe("defineContract", () => {
  describe("input なし", () => {
    const contract = defineContract({
      output: object({ name: string() }),
      fn: async () => okAs("成功", { value: { name: "Alice" } }),
    })

    it("fn の結果に output スキーマのバリデーションを適用する", async () => {
      const result = await contract()
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toEqual({ name: "Alice" })
      }
    })
  })

  describe("input あり", () => {
    const contract = defineContract({
      input: object({ name: pipe(string(), minLength(1)) }),
      output: object({ name: string() }),
      onInputError: defaultInputError(["nameが空"]),
      fn: async (input) => okAs("作成成功", { value: { name: input.name } }),
    })

    it("有効な入力で fn を実行し output をバリデーションする", async () => {
      const result = await contract({ name: "Alice" })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toEqual({ name: "Alice" })
      }
    })

    it("無効な入力で onInputError を呼ぶ", async () => {
      const result = await contract({ name: "" })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe("validation_failed")
      }
    })
  })

  describe("fn が失敗を返す場合", () => {
    const contract = defineContract({
      output: object({ id: string() }),
      fn: async () => failAs("見つからない", "not_found"),
    })

    it("失敗結果をそのまま返す（output バリデーションをスキップ）", async () => {
      const result = await contract()
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe("not_found")
      }
    })
  })
})
