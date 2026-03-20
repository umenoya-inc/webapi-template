import { object, pipe, string, uuid } from "valibot"
import { and, eq, gt } from "drizzle-orm"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { failAs, okAs } from "@/behavior"
import { defaultInputError, defineContract } from "@/contract"
import { requiredContext, defineEffect } from "@/effect"
import { AuthToken } from "./AuthToken"
import { authTokenTable } from "./authTokenTable"

/** トークンで認証情報を検索する。 */
export const findAuthToken = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
    defineContract({
      input: object({
        token: pipe(string(), uuid()),
      }),
      output: AuthToken,
      onInputError: defaultInputError(["トークンが不正"]),
      fn: async (input) => {
        const db = fromDbContext(context.db)
        const rows = await db
          .select()
          .from(authTokenTable)
          .where(
            and(eq(authTokenTable.token, input.token), gt(authTokenTable.expiresAt, new Date())),
          )
        if (rows.length === 0) {
          return failAs("トークンが存在しないまたは期限切れ", "not_found")
        }
        const row = rows[0]
        return okAs("有効なトークンを取得", {
          value: {
            token: row.token,
            userId: row.userId,
            expiresAt: row.expiresAt,
            createdAt: row.createdAt,
          },
        })
      },
    }),
)
