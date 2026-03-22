import { describe, expect, it } from "vite-plus/test"
import { matchBehavior } from "./matchBehavior"

describe("matchBehavior", () => {
  it("ok: true の場合は success ハンドラを呼ぶ", () => {
    const result = { ok: true as const, value: 42 }
    const output = matchBehavior(result, {
      success: (r) => `ok: ${r.value}`,
    })
    expect(output).toBe("ok: 42")
  })

  it("ok: false の場合は reason に対応するハンドラを呼ぶ", () => {
    const result = { ok: false as const, reason: "not_found" as const }
    const output = matchBehavior(result, {
      success: () => "success",
      not_found: () => "not found",
    })
    expect(output).toBe("not found")
  })

  it("複数の reason を正しく振り分ける", () => {
    type Result =
      | { ok: true; value: string }
      | { ok: false; reason: "not_found" }
      | { ok: false; reason: "forbidden" }

    const handle = (result: Result) =>
      matchBehavior(result, {
        success: (r) => `ok: ${r.value}`,
        not_found: () => "not found",
        forbidden: () => "forbidden",
      })

    expect(handle({ ok: true, value: "data" })).toBe("ok: data")
    expect(handle({ ok: false, reason: "not_found" })).toBe("not found")
    expect(handle({ ok: false, reason: "forbidden" })).toBe("forbidden")
  })

  it("未知の reason に対して例外を投げる", () => {
    const result = { ok: false, reason: "unknown_reason" }
    expect(() =>
      matchBehavior(result as { ok: false; reason: "unknown_reason" }, {} as never),
    ).toThrow("Unhandled behavior variant: unknown_reason")
  })
})
