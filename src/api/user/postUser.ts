import { email, maxLength, minLength, object, pipe, string, uuid } from "valibot"
import { failAs, matchBehavior, okAs } from "@/behavior"
import { defaultInputError } from "@/contract"
import { DbContext } from "@/db"
import { createUser } from "@/db/user"
import { defineRouteContract } from "../defineRouteContract"

/** ユーザー作成 API のハンドラロジック。 */
export const postUser = (ctx: DbContext, env: { createUser: typeof createUser } = { createUser }) =>
  defineRouteContract({
    input: object({
      name: pipe(string(), minLength(1), maxLength(100)),
      email: pipe(string(), email()),
    }),
    output: object({
      id: pipe(string(), uuid()),
      name: string(),
      email: pipe(string(), email()),
    }),
    onInputError: defaultInputError(["nameが空", "emailが不正", "name文字数超過"]),
    responses: {
      "作成成功": { status: 201, description: "ユーザーを新規作成" },
      "メールアドレスが重複": { status: 409, description: "メールアドレスが既に使用されている" },
      "入力値が不正": { status: 400, description: "入力値が不正" },
    },
    fn: async (input) =>
      matchBehavior(await env.createUser(ctx)(input), {
        success: (r) =>
          okAs("作成成功", {
            value: { id: r.value.id, name: r.value.name, email: r.value.email },
          }),
        duplicate_entry: () => failAs("メールアドレスが重複", "conflict"),
        validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
      }),
  })
