import { email, maxLength, minLength, object, pipe, string, uuid } from "valibot"
import type { DbContext } from "@/db"
import { failAs, okAs } from "@/behavior"
import { defaultInputError } from "@/contract"
import { registerUser } from "@/domain/user"
import { defineRouteContract } from "./defineRouteContract"

/** ユーザー作成 API のハンドラロジック。 */
export const postUser = (
  ctx: DbContext,
  env: { registerUser: typeof registerUser } = { registerUser },
) =>
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
    fn: async (input) => {
      const result = await env.registerUser(ctx)(input)
      if (!result.ok) {
        if (result.reason === "duplicate_entry") {
          return failAs("メールアドレスが重複", "conflict")
        }
        return failAs("入力値が不正", "bad_request", { fields: result.fields })
      }
      return okAs("作成成功", {
        value: { id: result.value.id, name: result.value.name, email: result.value.email },
      })
    },
  })
