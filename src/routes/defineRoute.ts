import type { BaseIssue, BaseSchema } from "valibot"
import type { Context, Env, Handler, Input, MiddlewareHandler } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { describeRoute, resolver, validator } from "hono-openapi"

/* eslint-disable @typescript-eslint/no-explicit-any */

type RouteOptions<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
> = {
  fn: () => (input: any) => Promise<{ ok: boolean; status: number }>
  input: TInputSchema
  output: TOutputSchema
  description: string
}

/** behavior 関数と API スキーマからルートハンドラを生成する。 */
export function defineRoute<
  TInputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TOutputSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(
  options: RouteOptions<TInputSchema, TOutputSchema>,
): [MiddlewareHandler, MiddlewareHandler, Handler] {
  return [
    describeRoute({
      description: options.description,
      responses: {
        200: {
          description: "Success",
          content: { "application/json": { schema: resolver(options.output) } },
        },
      },
    }),
    validator("json", options.input) as MiddlewareHandler,
    async (c: Context<Env, string, Input>) => {
      const result = await options.fn()(c.req.valid("json" as never))
      const { ok: _, status, ...body } = result as { ok: boolean; status: ContentfulStatusCode }
      return c.json(body, status) as Response
    },
  ]
}
