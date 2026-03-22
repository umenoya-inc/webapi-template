import type { BaseIssue, BaseSchema, ObjectEntries, ObjectSchema } from "valibot"
import type { Context, Env, Handler, Input, MiddlewareHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { describeRoute, resolver } from "hono-openapi"
import { descLabelKey } from "@/behavior"
import { inputSchemaKey, outputSchemaKey } from "@/contract"
import { EffectChainError, effectResultKey, resolveEffects } from "@/effect"
import type { EffectTrace } from "@/effect"
import { inputConfigKey } from "./inputConfigKey"
import { responsesKey } from "./responsesKey"

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RouteOptions {
  effect: (...args: any[]) => any
  provide: (c: Context<Env, string, Input>) => {
    service: Record<string, unknown>
    context: Record<string, unknown>
  }
  description: string
}

type Schema = BaseSchema<unknown, unknown, BaseIssue<unknown>>
interface ResponseEntry {
  status: number
  description?: string
}
type ResponsesMap = Record<string, ResponseEntry>

interface InputConfig {
  params?: ObjectSchema<ObjectEntries, any>
  query?: ObjectSchema<ObjectEntries, any>
  headers?: ObjectSchema<ObjectEntries, any>
  body?: ObjectSchema<ObjectEntries, any>
}

/** Effect と provide から OpenAPI 付きルートハンドラを生成する。 */
export function defineRoute(options: RouteOptions): [MiddlewareHandler, Handler] {
  const contractFn = (options.effect as unknown as Record<symbol, unknown>)[effectResultKey] as
    | ((...args: any[]) => any)
    | undefined
  const outputSchema = contractFn ? findSchema(contractFn, outputSchemaKey) : undefined
  const fnInputSchema = contractFn ? findSchema(contractFn, inputSchemaKey) : undefined
  const responses = contractFn ? findResponses(contractFn, responsesKey) : undefined
  const inputConfig = findInputConfig(fnInputSchema)

  return [
    describeRoute({
      description: options.description,
      ...buildOpenAPIInput(fnInputSchema, inputConfig),
      responses: buildOpenAPIResponses(outputSchema, responses) as never,
    }),
    async (c: Context<Env, string, Input>) => {
      const traces: EffectTrace[] = []
      try {
        const { service, context } = options.provide(c)
        const resolvedService = resolveEffects(service as Record<string, any>, (t) =>
          traces.push(t),
        )
        const effectFn = options.effect(resolvedService)(context)
        const result = inputConfig
          ? await effectFn(await extractInput(c, inputConfig))
          : fnInputSchema
            ? await effectFn(await c.req.json())
            : await effectFn()
        const label = (result as Record<symbol, string>)[descLabelKey]
        const status = responses?.[label]?.status ?? (result.ok ? 200 : 400)
        const { ok: _, ...rest } = result as Record<string, unknown>
        delete rest[descLabelKey as unknown as string]
        if (traces.length > 0) {
          console.log("Effect traces:", {
            method: c.req.method,
            path: c.req.path,
            traces: traces.map((t) => ({
              effect: t.effect,
              durationMs: Math.round(t.durationMs * 100) / 100,
            })),
          })
        }
        return c.json(rest, status as ContentfulStatusCode) as Response
      } catch (e) {
        const request = { method: c.req.method, path: c.req.path }
        if (e instanceof EffectChainError) {
          console.error("Unhandled effect error:", {
            ...request,
            chain: e.chain,
            inputs: e.inputs,
            durations: e.durations,
            message: e.message,
            cause: e.cause,
          })
        } else {
          console.error("Unhandled error:", { ...request, error: e })
        }
        return c.json({ error: "Internal Server Error" }, 500)
      }
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

/** 関数からシンボルキーでスキーマを取得する */
function findSchema(fn: (...args: any[]) => any, schemaKey: symbol): Schema | undefined {
  return (fn as unknown as Record<symbol, unknown>)[schemaKey] as Schema | undefined
}

/** 関数からシンボルキーで responses マップを取得する */
function findResponses(fn: (...args: any[]) => any, key: symbol): ResponsesMap | undefined {
  return (fn as unknown as Record<symbol, unknown>)[key] as ResponsesMap | undefined
}
