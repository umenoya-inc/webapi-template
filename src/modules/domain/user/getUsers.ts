import { array } from "valibot"
import type { DbContext } from "@/modules/db"
import { defineContract } from "@/modules/contract"
import { User, listUsers } from "@/modules/db/user"

/**
 * ユーザー一覧を取得する。
 *
 * - 登録済みのユーザーを Branded な User の配列として返す
 * - ユーザーが存在しない場合は空配列を返す
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
      if (!result.ok) {
        return result
      }
      return { ok: true, value: result.value } as const
    },
  })
