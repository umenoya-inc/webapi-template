import { email, maxLength, minLength, object, pipe, string } from "valibot"
import type { DbContext } from "../DbContext"
import { dbExecute } from "../error/dbExecute"
import { fromDbContext } from "../fromDbContext"
import { defaultInputError, defineContract, failAs, okAs } from "@/contract"
import { User } from "./User"
import { userTable } from "./userTable"

/** ユーザーを新規作成する。 */
export const createUser = (ctx: DbContext) =>
  defineContract({
    input: object({
      name: pipe(string(), minLength(1), maxLength(100)),
      email: pipe(string(), email()),
    }),
    output: User,
    onInputError: defaultInputError(["nameが空", "emailが不正", "name文字数超過"]),
    fn: async (input) => {
      const db = fromDbContext(ctx)
      const result = await dbExecute(() =>
        db.insert(userTable).values({ name: input.name, email: input.email }).returning(),
      )
      if (!result.ok) {
        if (result.error.kind === "unique_violation") {
          return failAs("メールアドレスが既存ユーザーと重複", "duplicate_entry", { field: "email" })
        }
        throw new Error("Unexpected database error", { cause: result.error.cause })
      }
      const row = result.value[0]
      return okAs("ユーザーを新規作成", {
        value: { id: row.id, name: row.name, email: row.email },
      })
    },
  })
