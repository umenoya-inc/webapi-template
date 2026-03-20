import type { BaseIssue, BaseSchema, ObjectEntries, ObjectSchema } from "valibot"
import type { Context, Env, Handler, Input, MiddlewareHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { describeRoute, resolver } from "hono-openapi"
import { descLabelKey } from "@/behavior"
import { inputSchemaKey, outputSchemaKey } from "@/contract"
import { inputConfigKey } from "./inputConfigKey"
import { responsesKey } from "./responsesKey"

/* eslint-disable @typescript-eslint/no-explicit-any */

type RouteOptions = {
  fn: (...args: any[]) => any
  resolve?: (c: Context<Env, string, Input>) => unknown
  description: string
}

type Schema = BaseSchema<unknown, unknown, BaseIssue<unknown>>
type ResponseEntry = { status: number; description?: string }
type ResponsesMap = Record<string, ResponseEntry>

type InputConfig = {
  params?: ObjectSchema<ObjectEntries, any>
  query?: ObjectSchema<ObjectEntries, any>
  headers?: ObjectSchema<ObjectEntries, any>
  body?: ObjectSchema<ObjectEntries, any>
}

/** contract 関数と説明から OpenAPI 付きルートハンドラを生成する。 */
export function defineRoute(options: RouteOptions): [MiddlewareHandler, Handler] {
  const outputSchema = findSchema(options.fn, outputSchemaKey)
  const fnInputSchema = findSchema(options.fn, inputSchemaKey)
  const responses = findResponses(options.fn, responsesKey)
  const inputConfig = findInputConfig(fnInputSchema)

  return [
    describeRoute({
      description: options.description,
      ...buildOpenAPIInput(fnInputSchema, inputConfig),
      responses: buildOpenAPIResponses(outputSchema, responses) as never,
    }),
    async (c: Context<Env, string, Input>) => {
      const resolved = options.resolve?.(c)
      const contractFn = resolved !== undefined ? options.fn(resolved) : options.fn()
      const result = inputConfig
        ? await contractFn(await extractInput(c, inputConfig))
        : fnInputSchema
          ? await contractFn(await c.req.json())
          : await contractFn()
      const label = (result as Record<symbol, string>)[descLabelKey]
      const status = responses?.[label]?.status ?? (result.ok ? 200 : 400)
      const { ok: _, ...rest } = result as Record<string, unknown>
      delete rest[descLabelKey as unknown as string]
      return c.json(rest, status as ContentfulStatusCode) as Response
    },
  ]
}

/** input スキーマから routeInput のメタデータを取得する。 */
function findInputConfig(schema: Schema | undefined): InputConfig | undefined {
  if (!schema) return undefined
  return (schema as unknown as Record<symbol, unknown>)[inputConfigKey] as InputConfig | undefined
}

/** リクエストの各ソースからフィールドを抽出してマージする。 */
async function extractInput(
  c: Context<Env, string, Input>,
  config: InputConfig,
): Promise<Record<string, unknown>> {
  let input: Record<string, unknown> = {}
  if (config.params) {
    for (const name of Object.keys(config.params.entries)) {
      input[name] = c.req.param(name)
    }
  }
  if (config.query) {
    for (const name of Object.keys(config.query.entries)) {
      input[name] = c.req.query(name)
    }
  }
  if (config.headers) {
    for (const name of Object.keys(config.headers.entries)) {
      input[name] = c.req.header(name)
    }
  }
  if (config.body) {
    const body = await c.req.json()
    input = { ...input, ...body }
  }
  return input
}

/** OpenAPI の parameters と requestBody を構築する。 */
function buildOpenAPIInput(
  inputSchema: Schema | undefined,
  config: InputConfig | undefined,
): Record<string, any> {
  const result: Record<string, any> = {}

  if (config) {
    const params: any[] = []
    if (config.params) {
      for (const [name, fieldSchema] of Object.entries(config.params.entries)) {
        params.push({
          name,
          in: "path",
          required: true,
          schema: resolver(fieldSchema as Schema),
        })
      }
    }
    if (config.query) {
      for (const [name, fieldSchema] of Object.entries(config.query.entries)) {
        params.push({
          name,
          in: "query",
          schema: resolver(fieldSchema as Schema),
        })
      }
    }
    if (config.headers) {
      for (const [name, fieldSchema] of Object.entries(config.headers.entries)) {
        params.push({
          name,
          in: "header",
          schema: resolver(fieldSchema as Schema),
        })
      }
    }
    if (params.length > 0) {
      result.parameters = params
    }
    if (config.body) {
      result.requestBody = {
        content: {
          "application/json": { schema: resolver(config.body as Schema) },
        },
      }
    }
  } else if (inputSchema) {
    result.requestBody = {
      content: {
        "application/json": { schema: resolver(inputSchema) },
      },
    }
  }

  return result
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
