import { compare } from "bcryptjs"
import { date, email, object, pipe, string, uuid } from "valibot"
import { failAs, matchBehavior, okAs } from "@/behavior"
import { defaultInputError } from "@/contract"
import { createAuthToken } from "@/db/auth"
import { findUserByEmail } from "@/db/user"
import { defineEffect } from "@/effect"
import { defineRouteContract } from "../defineRouteContract"

/** ログイン API のハンドラロジック。 */
export const postLogin = defineEffect(
  { service: { findUserByEmail, createAuthToken } },
  (service) => (context) =>
    defineRouteContract({
      input: object({
        email: pipe(string(), email()),
        password: string(),
      }),
      output: object({
        token: pipe(string(), uuid()),
        expiresAt: date(),
      }),
      onInputError: defaultInputError(["emailが不正"]),
      responses: {
        "ログイン成功": { status: 200, description: "ログインしてアクセストークンを取得" },
        "認証失敗": { status: 401, description: "メールアドレスまたはパスワードが正しくない" },
        "入力値が不正": { status: 400, description: "入力値が不正" },
      },
      fn: async (input) => {
        const userResult = await service.findUserByEmail(context)({ email: input.email })
        if (!userResult.ok) {
          return matchBehavior(userResult, {
            not_found: () => failAs("認証失敗", "unauthorized"),
            validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
          })
        }
        const passwordValid = await compare(input.password, userResult.value.passwordHash)
        if (!passwordValid) {
          return failAs("認証失敗", "unauthorized")
        }
        const tokenResult = await service.createAuthToken(context)({
          userId: userResult.value.id,
        })
        if (!tokenResult.ok) {
          return matchBehavior(tokenResult, {
            validation_failed: () => failAs("入力値が不正", "bad_request", { fields: {} }),
          })
        }
        return okAs("ログイン成功", {
          value: { token: tokenResult.value.token, expiresAt: tokenResult.value.expiresAt },
        })
      },
    }),
)
