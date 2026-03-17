import { email, flatten, maxLength, minLength, object, pipe, string } from "valibot"
import type { DbContext } from "../DbContext"
import { dbExecute } from "../error/dbExecute"
import { fromDbContext } from "../fromDbContext"
import { defineContract } from "@/modules/contract"
import { User } from "./User"
import { userTable } from "./userTable"

/**
 * ユーザーを新規作成し、作成されたユーザーを返す。
 * email が既に存在する場合は unique_violation エラーを返す。
 */
export const createUser = (ctx: DbContext) =>
  defineContract({
    input: object({
      name: pipe(string(), minLength(1), maxLength(100)),
      email: pipe(string(), email()),
    }),
    output: User,
    onInputError: (issues) =>
      ({
        ok: false,
        reason: "validation_failed",
        fields: flatten(issues).nested ?? {},
      }) as const,
    fn: async (input) => {
      const db = fromDbContext(ctx)
      const result = await dbExecute(() =>
        db.insert(userTable).values({ name: input.name, email: input.email }).returning(),
      )
      if (!result.ok) {
        if (result.error.kind === "unique_violation") {
          return {
            ok: false,
            reason: "duplicate_entry",
            field: "email" as const,
          }
        }
        throw new Error("Unexpected database error", { cause: result.error.cause })
      }
      const row = result.value[0]
      return {
        ok: true,
        value: { id: row.id, name: row.name, email: row.email },
      } as const
    },
  })
