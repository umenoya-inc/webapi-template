import { email, maxLength, minLength, object, pipe, string, uuid } from "valibot"
import type { DbContext } from "@/db"
import { defineContract, failAs, okAs } from "@/contract"
import { registerUser } from "@/domain/user"

/** ユーザー作成 API のハンドラロジック。 */
export const postUser = (ctx: DbContext) =>
  defineContract({
    input: object({
      name: pipe(string(), minLength(1), maxLength(100)),
      email: pipe(string(), email()),
    }),
    output: object({
      id: pipe(string(), uuid()),
      name: string(),
      email: pipe(string(), email()),
    }),
    fn: async (input) => {
      const result = await registerUser(ctx)(input)
      if (!result.ok) {
        if (result.reason === "duplicate_entry") {
          return failAs("メールアドレスが重複", "conflict", { status: 409 as const })
        }
        return failAs("入力値が不正", "bad_request", {
          status: 400 as const,
          fields: result.fields,
        })
      }
      return okAs("作成成功", {
        value: { id: result.value.id, name: result.value.name, email: result.value.email },
        status: 201 as const,
      })
    },
  })
