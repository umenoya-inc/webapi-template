import { array } from "valibot"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { defineContract, okAs } from "@/modules/contract"
import { User } from "./User"
import { userTable } from "./userTable"

/** ユーザー一覧を取得する。 */
export const listUsers = (ctx: DbContext) =>
  defineContract({
    output: array(User),
    fn: async () => {
      const db = fromDbContext(ctx)
      const rows = await db.select().from(userTable)
      if (rows.length === 0) {
        return okAs("ユーザーが存在しない", [])
      }
      return okAs(
        "登録済みユーザー一覧を取得",
        rows.map((row) => ({ id: row.id, name: row.name, email: row.email })),
      )
    },
  })
