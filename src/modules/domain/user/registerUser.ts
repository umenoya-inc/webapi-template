import { email, maxLength, minLength, object, pipe, string } from "valibot"
import type { DbContext } from "@/modules/db"
import { defineContract } from "@/modules/contract"
import { User, createUser } from "@/modules/db/user"

export const registerUser = (
  ctx: DbContext,
  env: {
    createUser: typeof createUser
  } = { createUser },
) =>
  defineContract({
    input: object({
      name: pipe(string(), minLength(1), maxLength(100)),
      email: pipe(string(), email()),
    }),
    output: User,
    fn: async (input) => {
      const result = await env.createUser(ctx)({ name: input.name, email: input.email })
      if (!result.ok) {
        return result
      }
      return { ok: true, value: result.value } as const
    },
  })
