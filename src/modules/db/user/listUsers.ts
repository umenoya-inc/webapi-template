import { array, object } from "valibot"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { defineContract } from "@/modules/contract"
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
    input: object({}),
    output: array(User),
    fn: async () => {
      const db = fromDbContext(ctx)
      const rows = await db.select().from(userTable)
      return {
        ok: true,
        value: rows.map((row) => ({ id: row.id, name: row.name, email: row.email })),
      } as const
    },
  })
