import { object, pipe, string, uuid } from "valibot"
import { eq } from "drizzle-orm"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { defineContract, failAs } from "@/modules/contract"
import { User } from "./User"
import { userTable } from "./userTable"

/**
 * ID を指定してユーザーを取得する。
 *
 * - 該当するユーザーが存在する場合、Branded な User を返す
 * - 該当するユーザーが存在しない場合、not_found エラーを返す
 * - ID の形式が不正な場合、validation_failed エラーを返す
 */
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
      return {
        ok: true,
        value: { id: row.id, name: row.name, email: row.email },
      } as const
    },
  })
