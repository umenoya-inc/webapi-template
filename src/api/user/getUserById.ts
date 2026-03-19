import { email, object, pipe, string, uuid } from "valibot"
import { failAs, matchBehavior, okAs } from "@/behavior"
import { defaultInputError } from "@/contract"
import { findUserById } from "@/db/user"
import { defineRouteContract } from "../defineRouteContract"
import { routeInput } from "../routeInput"

/** ユーザー取得 API のハンドラロジック。 */
export const getUserById = (
  ctx: Parameters<typeof findUserById>[0],
  env: { findUserById: typeof findUserById } = { findUserById },
) =>
  defineRouteContract({
    input: routeInput({
      params: object({ id: pipe(string(), uuid()) }),
    }),
    output: object({
      id: pipe(string(), uuid()),
      name: string(),
      email: pipe(string(), email()),
    }),
    onInputError: defaultInputError(["IDが不正"]),
    responses: {
      "取得成功": { status: 200, description: "ユーザーを取得" },
      "ユーザーが見つからない": {
        status: 404,
        description: "指定された ID のユーザーが存在しない",
      },
      "入力値が不正": { status: 400, description: "入力値が不正" },
    },
    fn: async (input) =>
      matchBehavior(await env.findUserById(ctx)(input), {
        success: (r) =>
          okAs("取得成功", {
            value: { id: r.value.id, name: r.value.name, email: r.value.email },
          }),
        not_found: () => failAs("ユーザーが見つからない", "not_found"),
        validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
      }),
  })
