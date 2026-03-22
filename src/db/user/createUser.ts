import { hash } from "bcryptjs"
import { email, maxLength, minLength, object, pipe, string } from "valibot"
import type { DbContext } from "../DbContext"
import { pgExecute } from "../error/pgExecute"
import { fromDbContext } from "../fromDbContext"
import { failAs, okAs } from "@/behavior"
import { defaultInputError, defineContract } from "@/contract"
import { requiredContext, defineEffect } from "@/effect"
import { User } from "./User"
import { userTable } from "./userTable"

/** ユーザーを新規作成する。 */
export const createUser = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
    defineContract({
      input: object({
        name: pipe(string(), minLength(1), maxLength(100)),
        email: pipe(string(), email()),
        password: pipe(string(), minLength(8)),
      }),
      output: User,
      onInputError: defaultInputError([
        "nameが空",
        "emailが不正",
        "name文字数超過",
        "パスワードが短すぎる",
      ]),
      fn: async (input) => {
        const db = fromDbContext(context.db)
        const passwordHash = await hash(input.password, 10)
        const result = await pgExecute(() =>
          db
            .insert(userTable)
            .values({ name: input.name, email: input.email, passwordHash })
            .returning(),
        )
        if (!result.ok) {
          if (result.error.kind === "unique_violation") {
            return failAs("メールアドレスが既存ユーザーと重複", "duplicate_entry", {
              field: "email",
            })
          }
          throw new Error("Unexpected database error", { cause: result.error.cause })
        }
        const row = result.value[0]
        return okAs("ユーザーを新規作成", {
          value: { id: row.id, name: row.name, email: row.email },
        })
      },
    }),
)
