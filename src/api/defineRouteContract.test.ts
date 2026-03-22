import { object, pipe, string, minLength } from "valibot"
import { describe, expect, it } from "vite-plus/test"
import { okAs, failAs } from "@/behavior"
import { defaultInputError, inputSchemaKey, outputSchemaKey } from "@/contract"
import { defineRouteContract } from "./defineRouteContract"
import { responsesKey } from "./responsesKey"

describe("defineRouteContract", () => {
  describe("input なし", () => {
    const contract = defineRouteContract({
      output: object({ name: string() }),
      responses: { "成功": { status: 200 } },
      fn: async () => okAs("成功", { value: { name: "Alice" } }),
    })

    it("fn の結果に output スキーマを適用する", async () => {
      const result = await contract()
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toEqual({ name: "Alice" })
      }
    })

    it("outputSchemaKey にスキーマを保持する", () => {
      const schema = (contract as unknown as Record<symbol, unknown>)[outputSchemaKey]
      expect(schema).toBeDefined()
    })

    it("responsesKey に responses マップを保持する", () => {
      const responses = (contract as unknown as Record<symbol, unknown>)[responsesKey]
      expect(responses).toEqual({ "成功": { status: 200 } })
    })

    it("inputSchemaKey は付与されない", () => {
      const schema = (contract as unknown as Record<symbol, unknown>)[inputSchemaKey]
      expect(schema).toBeUndefined()
    })
  })

  describe("input あり", () => {
    const contract = defineRouteContract({
      input: object({ name: pipe(string(), minLength(1)) }),
      output: object({ name: string() }),
      onInputError: defaultInputError(["nameが空"]),
      responses: {
        "作成成功": { status: 201 },
        "入力値が不正": { status: 400 },
      },
      fn: async (input) => okAs("作成成功", { value: { name: input.name } }),
    })

    it("有効な入力で fn を実行する", async () => {
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

    it("inputSchemaKey にスキーマを保持する", () => {
      const schema = (contract as unknown as Record<symbol, unknown>)[inputSchemaKey]
      expect(schema).toBeDefined()
    })
  })

  describe("fn が失敗を返す場合", () => {
    const contract = defineRouteContract({
      output: object({ id: string() }),
      responses: {
        "取得成功": { status: 200 },
        "見つからない": { status: 404 },
      },
      fn: async (): Promise<any> => failAs("見つからない", "not_found"),
    })

    it("失敗結果をそのまま返す", async () => {
      const result = await contract()
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toBe("not_found")
      }
    })
  })
})
