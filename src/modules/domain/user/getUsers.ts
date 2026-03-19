import { array } from "valibot"
import type { DbContext } from "@/modules/db"
import { defineContract } from "@/modules/contract"
import { User, listUsers } from "@/modules/db/user"

/**
 * ユーザー一覧を取得する。
 *
 * - 登録済みのユーザーが存在する場合、Branded な User の配列を返す
 * - ユーザーが存在しない場合、空配列を返す
 */
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
