import { object, pipe, string, minLength, parse } from "valibot"
import { describe, expect, it } from "vite-plus/test"
import { inputConfigKey } from "./inputConfigKey"
import { routeInput } from "./routeInput"

describe("routeInput", () => {
  it("params のみのスキーマをマージする", () => {
    const schema = routeInput({
      params: object({ id: string() }),
    })

    const result = parse(schema, { id: "abc" })
    expect(result).toEqual({ id: "abc" })
  })

  it("params + body の entries をマージした単一スキーマを返す", () => {
    const schema = routeInput({
      params: object({ id: string() }),
      body: object({ name: pipe(string(), minLength(1)) }),
    })

    const result = parse(schema, { id: "abc", name: "Alice" })
    expect(result).toEqual({ id: "abc", name: "Alice" })
  })

  it("4ソース全てをマージできる", () => {
    const schema = routeInput({
      params: object({ id: string() }),
      query: object({ page: string() }),
      headers: object({ token: string() }),
      body: object({ name: string() }),
    })

    const result = parse(schema, { id: "1", page: "2", token: "t", name: "Alice" })
    expect(result).toEqual({ id: "1", page: "2", token: "t", name: "Alice" })
  })

  it("空の config で空の object スキーマを返す", () => {
    const schema = routeInput({})

    const result = parse(schema, {})
    expect(result).toEqual({})
  })

  it("inputConfigKey に元の config を保持する", () => {
    const params = object({ id: string() })
    const body = object({ name: string() })

    const schema = routeInput({ params, body })
    const config = (schema as unknown as Record<symbol, unknown>)[inputConfigKey] as {
      params: typeof params
      body: typeof body
    }

    expect(config.params).toBe(params)
    expect(config.body).toBe(body)
  })

  it("バリデーション付きスキーマで無効な入力を拒否する", () => {
    const schema = routeInput({
      body: object({ name: pipe(string(), minLength(1)) }),
    })

    expect(() => parse(schema, { name: "" })).toThrow()
  })
})
