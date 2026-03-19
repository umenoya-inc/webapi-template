import { object, pipe, string, uuid } from "valibot"
import { eq } from "drizzle-orm"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { defineContract, failAs, okAs } from "@/contract"
import { User } from "./User"
import { userTable } from "./userTable"

/** ID を指定してユーザーを取得する。 */
export const findUserById = (ctx: DbContext) =>
  defineContract({
    input: object({
      id: pipe(string(), uuid()),
    }),
    output: User,
    fn: async (input) => {
      const db = fromDbContext(ctx)
      const rows = await db.select().from(userTable).where(eq(userTable.id, input.id))
      if (rows.length === 0) {
        return failAs("IDに該当するユーザーが存在しない", "not_found")
      }
      const row = rows[0]
      return okAs("IDに該当するユーザーを取得", {
        value: { id: row.id, name: row.name, email: row.email },
      })
    },
  })
