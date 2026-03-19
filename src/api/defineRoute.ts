import type { BaseIssue, BaseSchema } from "valibot"
import type { Context, Env, Handler, Input, MiddlewareHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { describeRoute, resolver } from "hono-openapi"
import { descLabelKey } from "@/behavior"
import { outputSchemaKey } from "@/contract"
import { responsesKey } from "./responsesKey"

/* eslint-disable @typescript-eslint/no-explicit-any */

type RouteOptions = {
  fn: (...args: any[]) => any
  description: string
}

type Schema = BaseSchema<unknown, unknown, BaseIssue<unknown>>
type ResponseEntry = { status: number; description?: string }
type ResponsesMap = Record<string, ResponseEntry>

/** contract 関数と説明から OpenAPI 付きルートハンドラを生成する。 */
export function defineRoute(options: RouteOptions): [MiddlewareHandler, Handler] {
  const outputSchema = findSchema(options.fn, outputSchemaKey)
  const responses = findResponses(options.fn, responsesKey)

  return [
    describeRoute({
      description: options.description,
      responses: buildOpenAPIResponses(outputSchema, responses) as never,
    }),
    async (c: Context<Env, string, Input>) => {
      const body = await c.req.json()
      const contractFn = options.fn()
      const result = await contractFn(body)
      const label = (result as Record<symbol, string>)[descLabelKey]
      const status = responses?.[label]?.status ?? (result.ok ? 200 : 400)
      const { ok: _, ...rest } = result as Record<string, unknown>
      delete rest[descLabelKey as unknown as string]
      return c.json(rest, status as ContentfulStatusCode) as Response
    },
  ]
}

/** OpenAPI responses オブジェクトを構築する */
function buildOpenAPIResponses(
  outputSchema: Schema | undefined,
  responses: ResponsesMap | undefined,
) {
  if (!responses) {
    return {
      200: {
        description: "Success",
        content: outputSchema
          ? { "application/json": { schema: resolver(outputSchema) } }
          : undefined,
      },
    }
  }

  const result: Record<string, unknown> = {}
  for (const [label, entry] of Object.entries(responses)) {
    const statusKey = String(entry.status)
    if (!result[statusKey]) {
      result[statusKey] = {
        description: entry.description ?? label,
        ...(entry.status < 400 && outputSchema
          ? { content: { "application/json": { schema: resolver(outputSchema) } } }
          : {}),
      }
    }
  }
  return result
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

/** 関数から再帰的に responses マップを探索する */
function findResponses(fn: (...args: any[]) => any, key: symbol): ResponsesMap | undefined {
  const direct = (fn as unknown as Record<symbol, unknown>)[key] as ResponsesMap | undefined
  if (direct) return direct

  try {
    const inner = fn()
    if (typeof inner === "function") {
      return findResponses(inner, key)
    }
  } catch {
    // 呼び出しに失敗した場合は探索終了
  }
  return undefined
}
