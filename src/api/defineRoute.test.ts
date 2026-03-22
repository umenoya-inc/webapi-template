import { object, pipe, string, minLength } from "valibot"
import { Hono } from "hono"
import { describe, expect, it } from "vite-plus/test"
import { okAs, failAs } from "@/behavior"
import { defaultInputError, defineContract } from "@/contract"
import { defineEffect, requiredContext } from "@/effect"
import { defineRoute } from "./defineRoute"
import { defineRouteContract } from "./defineRouteContract"
import { routeInput } from "./routeInput"

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * テスト用の noop Leaf Effect。
 * findEffectContractFn のダミー探索で fn が実際に呼ばれるため、
 * output バリデーションを通る値を返す必要がある。
 */
const noopLeaf = defineEffect({ context: requiredContext<{ db: unknown }>() }, (_ctx) =>
  defineContract({
    output: object({}),
    fn: async () => okAs("noop", { value: {} }),
  }),
)

describe("defineRoute", () => {
  describe("正常系", () => {
    const greetEffect = defineEffect(
      { service: { noopLeaf } } as any,
      (_service: any) => (ctx: any) =>
        defineRouteContract({
          output: object({ message: string() }),
          responses: { "挨拶を返す": { status: 200 } },
          fn: async () => okAs("挨拶を返す", { value: { message: String(ctx.greeting ?? "") } }),
        }),
    )

    const app = new Hono()
    app.get(
      "/greet",
      ...defineRoute({
        effect: greetEffect,
        provide: () => ({
          service: { noopLeaf },
          context: { greeting: "hello" },
        }),
        description: "挨拶",
      }),
    )

    it("200 と JSON レスポンスを返す", async () => {
      const res = await app.request("/greet")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.value.message).toBe("hello")
    })

    it("レスポンスに ok フィールドを含まない", async () => {
      const res = await app.request("/greet")
      const body = await res.json()
      expect(body.ok).toBeUndefined()
    })
  })

  describe("失敗系（DU）", () => {
    const findEffect = defineEffect(
      { service: { noopLeaf } } as any,
      (_service: any) => (_ctx: any) =>
        defineRouteContract({
          output: object({ name: string() }),
          responses: {
            "ユーザーを取得": { status: 200 },
            "見つからない": { status: 404 },
          },
          fn: async (): Promise<any> => failAs("見つからない", "not_found"),
        }),
    )

    const app = new Hono()
    app.get(
      "/user",
      ...defineRoute({
        effect: findEffect,
        provide: () => ({
          service: { noopLeaf },
          context: {},
        }),
        description: "ユーザー取得",
      }),
    )

    it("responses マップに基づいたステータスコードを返す", async () => {
      const res = await app.request("/user")
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.reason).toBe("not_found")
    })
  })

  describe("例外時（Let it crash）", () => {
    // provide で例外を投げることでハンドラ内の catch を検証する
    const crashEffect = defineEffect(
      { service: { noopLeaf } } as any,
      (_service: any) => (_ctx: any) =>
        defineRouteContract({
          output: object({ value: string() }),
          responses: { "成功": { status: 200 } },
          fn: async () => okAs("成功", { value: { value: "ok" } }),
        }),
    )

    const app = new Hono()
    app.get(
      "/crash",
      ...defineRoute({
        effect: crashEffect,
        provide: () => {
          throw new Error("Unexpected database error")
        },
        description: "クラッシュ",
      }),
    )

    it("500 と Internal Server Error を返す", async () => {
      const res = await app.request("/crash")
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBe("Internal Server Error")
    })
  })

  describe("input バリデーション", () => {
    const createEffect = defineEffect(
      { service: { noopLeaf } } as any,
      (_service: any) => (_ctx: any) =>
        defineRouteContract({
          input: object({ name: pipe(string(), minLength(1)) }),
          output: object({ name: string() }),
          onInputError: defaultInputError(["nameが空"]),
          responses: {
            "作成成功": { status: 201 },
            "入力値が不正": { status: 400 },
          },
          fn: async (input) => okAs("作成成功", { value: { name: input.name } }),
        }),
    )

    const app = new Hono()
    app.post(
      "/user",
      ...defineRoute({
        effect: createEffect,
        provide: () => ({
          service: { noopLeaf },
          context: {},
        }),
        description: "ユーザー作成",
      }),
    )

    it("有効な入力で成功レスポンスを返す", async () => {
      const res = await app.request("/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.value.name).toBe("Alice")
    })

    it("無効な入力でバリデーションエラーを返す", async () => {
      const res = await app.request("/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.reason).toBe("validation_failed")
    })
  })

  describe("routeInput による入力抽出", () => {
    const getByIdEffect = defineEffect(
      { service: { noopLeaf } } as any,
      (_service: any) => (_ctx: any) =>
        defineRouteContract({
          input: routeInput({
            params: object({ id: string() }),
          }),
          output: object({ id: string() }),
          onInputError: defaultInputError(["IDが不正"]),
          responses: {
            "取得成功": { status: 200 },
            "入力値が不正": { status: 400 },
          },
          fn: async (input) => okAs("取得成功", { value: { id: input.id } }),
        }),
    )

    const app = new Hono()
    app.get(
      "/item/:id",
      ...defineRoute({
        effect: getByIdEffect,
        provide: () => ({
          service: { noopLeaf },
          context: {},
        }),
        description: "アイテム取得",
      }),
    )

    it("パスパラメータから入力を抽出する", async () => {
      const res = await app.request("/item/abc-123")
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.value.id).toBe("abc-123")
    })
  })
})
