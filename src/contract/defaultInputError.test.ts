import type { BaseIssue, StringIssue } from "valibot"
import { describe, expect, it } from "vite-plus/test"
import { descLabelKey } from "@/behavior"
import { defaultInputError } from "./defaultInputError"

describe("defaultInputError", () => {
  const handler = defaultInputError(["nameが空", "emailが不正"])

  const makeIssue = (path: string): BaseIssue<unknown> =>
    ({
      kind: "validation",
      type: "min_length",
      input: "",
      expected: ">=1",
      received: '""',
      message: "Invalid length",
      path: [{ type: "object", origin: "value", input: {}, key: path, value: "" }],
    }) as unknown as StringIssue

  it("validation_failed の reason を持つ失敗結果を返す", () => {
    const result = handler([makeIssue("name")])
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("validation_failed")
  })

  it("descLabelKey に「入力値が不正」ラベルを保持する", () => {
    const result = handler([makeIssue("name")])
    expect((result as Record<symbol, unknown>)[descLabelKey]).toBe("入力値が不正")
  })

  it("fields にフラット化された issue 情報を含む", () => {
    const result = handler([makeIssue("name")])
    expect(result.fields).toBeDefined()
  })
})
