import { email, maxLength, minLength, object, pipe, string } from "valibot"
import type { DbContext } from "../DbContext"
import { dbExecute } from "../error/dbExecute"
import { fromDbContext } from "../fromDbContext"
import { defineContract, failAs } from "@/modules/contract"
import { User } from "./User"
import { userTable } from "./userTable"

/**
 * ユーザーを新規作成する。
 *
 * - 正常に作成された場合、Branded な User を返す
 * - email が既存ユーザーと重複する場合、duplicate_entry エラーを返す
 * - 入力値が不正な場合、validation_failed エラーを返す
 */
export const createUser = (ctx: DbContext) =>
  defineContract({
    input: object({
      name: pipe(string(), minLength(1), maxLength(100)),
      email: pipe(string(), email()),
    }),
    output: User,
    fn: async (input) => {
      const db = fromDbContext(ctx)
      const result = await dbExecute(() =>
        db.insert(userTable).values({ name: input.name, email: input.email }).returning(),
      )
      if (!result.ok) {
        if (result.error.kind === "unique_violation") {
          return failAs("メールアドレスが既存ユーザーと重複", "duplicate_entry", { field: "email" })
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
