import { array } from "valibot"
import type { DbContext } from "@/db"
import { defineContract } from "@/contract"
import { User, listUsers } from "@/db/user"

/** ユーザー一覧を取得する。 */
export const getUsers = (
  ctx: DbContext,
  env: {
    listUsers: typeof listUsers
  } = { listUsers },
) =>
  defineContract({
    output: array(User),
    fn: async () => {
      const result = await env.listUsers(ctx)()
      return result
    },
  })
