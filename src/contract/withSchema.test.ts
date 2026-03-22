import { object, pipe, string, minLength } from "valibot"
import { describe, expect, it } from "vite-plus/test"
import { okAs, failAs } from "@/behavior"
import { withSchema } from "./withSchema"

describe("withSchema", () => {
  describe("input なし", () => {
    it("fn の ok:true の value を output スキーマで parse する", async () => {
      const fn = withSchema({
        output: object({ name: string() }),
        fn: async () => okAs("成功", { value: { name: "Alice" } }),
      })

      const result = await fn()
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toEqual({ name: "Alice" })
      }
    })

    it("output スキーマが余分なフィールドを除去する", async () => {
      const fn = withSchema({
        output: object({ name: string() }),
        fn: async () => okAs("成功", { value: { name: "Alice", extra: "removed" } }),
      })

      const result = await fn()
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toEqual({ name: "Alice" })
        expect("extra" in result.value).toBe(false)
      }
    })

    it("fn が ok:false を返したら output parse をスキップする", async () => {
      const fn = withSchema({
        output: object({ name: string() }),
        fn: async () => failAs("見つからない", "not_found"),
      })

      const result = await fn()
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe("not_found")
      }
    })

    it("fn の ok:true の value が output スキーマに違反する場合 throw する", async () => {
      const fn = withSchema({
        output: object({ name: string() }),
        fn: async () => okAs("成功", { value: { name: 123 } }) as any,
      })

      await expect(fn()).rejects.toThrow()
    })
  })

  describe("input あり", () => {
    const inputSchema = object({ name: pipe(string(), minLength(1)) })
    const outputSchema = object({ name: string() })

    it("有効な入力で fn を実行し output スキーマで parse する", async () => {
      const fn = withSchema({
        input: inputSchema,
        output: outputSchema,
        onInputError: () => failAs("入力値が不正", "validation_failed"),
        fn: async (input) => okAs("成功", { value: { name: input.name } }),
      })

      const result = await fn({ name: "Alice" })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toEqual({ name: "Alice" })
      }
    })

    it("無効な入力で onInputError を呼ぶ", async () => {
      const fn = withSchema({
        input: inputSchema,
        output: outputSchema,
        onInputError: () => failAs("入力値が不正", "validation_failed"),
        fn: async (input) => okAs("成功", { value: { name: input.name } }),
      })

      const result = await fn({ name: "" })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe("validation_failed")
      }
    })

    it("カスタム onInputError の戻り値をそのまま返す", async () => {
      const fn = withSchema({
        input: inputSchema,
        output: outputSchema,
        onInputError: (_issues) => failAs("カスタムエラー", "custom_error"),
        fn: async (input) => okAs("成功", { value: { name: input.name } }),
      })

      const result = await fn({ name: "" })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe("custom_error")
      }
    })
  })
})
