import type { BaseIssue, BaseSchema } from "valibot"
import type { Context, Env, Handler, Input, MiddlewareHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { describeRoute, resolver } from "hono-openapi"
import { inputSchemaKey, outputSchemaKey } from "@/contract"

/* eslint-disable @typescript-eslint/no-explicit-any */

type RouteOptions = {
  fn: (...args: any[]) => any
  description: string
}

type Schema = BaseSchema<unknown, unknown, BaseIssue<unknown>>

/** contract 関数と説明から OpenAPI 付きルートハンドラを生成する。 */
export function defineRoute(options: RouteOptions): [MiddlewareHandler, Handler] {
  const _inputSchema = findSchema(options.fn, inputSchemaKey)
  const outputSchema = findSchema(options.fn, outputSchemaKey)

  return [
    describeRoute({
      description: options.description,
      responses: {
        200: {
          description: "Success",
          content: outputSchema
            ? { "application/json": { schema: resolver(outputSchema) } }
            : undefined,
        },
      },
    }),
    async (c: Context<Env, string, Input>) => {
      const body = await c.req.json()
      const contractFn = options.fn()
      const result = await contractFn(body)
      const { ok: _, status, ...rest } = result as { ok: boolean; status: ContentfulStatusCode }
      return c.json(rest, status) as Response
    },
  ]
}

/** 関数から再帰的にスキーマを探索する */
function findSchema(fn: (...args: any[]) => any, schemaKey: symbol): Schema | undefined {
  const direct = (fn as unknown as Record<symbol, unknown>)[schemaKey] as Schema | undefined
  if (direct) return direct

  try {
    const inner = fn()
    if (typeof inner === "function") {
      return findSchema(inner, schemaKey)
    }
  } catch {
    // 呼び出しに失敗した場合は探索終了
  }
  return undefined
}
