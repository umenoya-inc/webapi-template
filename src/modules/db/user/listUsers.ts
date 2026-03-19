import { array } from "valibot"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { defineContract, okAs } from "@/modules/contract"
import { User } from "./User"
import { userTable } from "./userTable"

/**
 * ユーザー一覧を取得する。
 *
 * - 登録済みのユーザーを Branded な User の配列として返す
 * - ユーザーが存在しない場合は空配列を返す
 */
export const listUsers = (ctx: DbContext) =>
  defineContract({
    output: array(User),
    fn: async () => {
      const db = fromDbContext(ctx)
      const rows = await db.select().from(userTable)
      return okAs(
        "ユーザー一覧を取得",
        rows.map((row) => ({ id: row.id, name: row.name, email: row.email })),
      )
    },
  })
