import { array } from "valibot"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { okAs } from "@/behavior"
import { defineContract } from "@/contract"
import { defineEffect } from "@/effect"
import { User } from "./User"
import { userTable } from "./userTable"

/** ユーザー一覧を取得する。 */
export const listUsers = defineEffect({ context: {} as { db: DbContext } }, (context) =>
  defineContract({
    output: array(User),
    fn: async () => {
      const db = fromDbContext(context.db)
      const rows = await db.select().from(userTable)
      if (rows.length === 0) {
        return okAs("ユーザーが存在しない", { value: [] })
      }
      return okAs("登録済みユーザー一覧を取得", {
        value: rows.map((row) => ({ id: row.id, name: row.name, email: row.email })),
      })
    },
  }),
)
