import { array, object } from "valibot"
import type { DbContext } from "@/modules/db"
import { defineContract } from "@/modules/contract"
import { User, listUsers } from "@/modules/db/user"

export const getUsers = (
  ctx: DbContext,
  env: {
    listUsers: typeof listUsers
  } = { listUsers },
) =>
  defineContract({
    input: object({}),
    output: array(User),
    fn: async () => {
      const result = await env.listUsers(ctx)({})
      if (!result.ok) {
        return result
      }
      return { ok: true, value: result.value } as const
    },
  })
