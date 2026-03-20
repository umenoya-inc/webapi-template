import { email, object, pipe, string } from "valibot"
import { eq } from "drizzle-orm"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { failAs, okAs } from "@/behavior"
import { defaultInputError, defineContract } from "@/contract"
import { requiredContext, defineEffect } from "@/effect"
import { userTable } from "./userTable"

/** メールアドレスでユーザーを検索する。 */
export const findUserByEmail = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
    defineContract({
      input: object({
        email: pipe(string(), email()),
      }),
      output: object({
        id: string(),
        email: pipe(string(), email()),
        passwordHash: string(),
      }),
      onInputError: defaultInputError(["emailが不正"]),
      fn: async (input) => {
        const db = fromDbContext(context.db)
        const rows = await db.select().from(userTable).where(eq(userTable.email, input.email))
        if (rows.length === 0) {
          return failAs("メールアドレスに該当するユーザーが存在しない", "not_found")
        }
        const row = rows[0]
        return okAs("メールアドレスに該当するユーザーを取得", {
          value: { id: row.id, email: row.email, passwordHash: row.passwordHash },
        })
      },
    }),
)
