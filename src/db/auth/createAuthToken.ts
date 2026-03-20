import { date, object, pipe, string, uuid } from "valibot"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { okAs } from "@/behavior"
import { defaultInputError, defineContract } from "@/contract"
import { requiredContext, defineEffect } from "@/effect"
import { authTokenTable } from "./authTokenTable"

/** 認証トークンを発行する。 */
export const createAuthToken = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
    defineContract({
      input: object({
        userId: pipe(string(), uuid()),
      }),
      output: object({
        token: pipe(string(), uuid()),
        expiresAt: date(),
      }),
      onInputError: defaultInputError(["userIdが不正"]),
      fn: async (input) => {
        const db = fromDbContext(context.db)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const rows = await db
          .insert(authTokenTable)
          .values({ userId: input.userId, expiresAt })
          .returning()
        const row = rows[0]
        return okAs("トークンを発行", {
          value: { token: row.token, expiresAt: row.expiresAt },
        })
      },
    }),
)
