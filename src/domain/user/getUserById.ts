import { object, pipe, string, uuid } from "valibot"
import type { DbContext } from "@/db"
import { defineContract, okAs } from "@/contract"
import { User, findUserById } from "@/db/user"

/** ID を指定してユーザーを取得する。 */
export const getUserById = (
  ctx: DbContext,
  env: {
    findUserById: typeof findUserById
  } = { findUserById },
) =>
  defineContract({
    input: object({
      id: pipe(string(), uuid()),
    }),
    output: User,
    fn: async (input) => {
      const result = await env.findUserById(ctx)({ id: input.id })
      if (!result.ok) {
        return result
      }
      return okAs("IDに該当するユーザーを取得", { value: result.value })
    },
  })
