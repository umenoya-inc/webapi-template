import { object, pipe, string, uuid } from "valibot"
import type { DbContext } from "@/modules/db"
import { defineContract, okAs } from "@/modules/contract"
import { User, findUserById } from "@/modules/db/user"

/**
 * ID を指定してユーザーを取得する。
 *
 * - 該当するユーザーが存在する場合、Branded な User を返す
 * - 該当するユーザーが存在しない場合、not_found エラーを返す
 * - ID の形式が不正な場合、validation_failed エラーを返す
 */
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
      return okAs("IDに該当するユーザーを取得", result.value)
    },
  })
