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
        return matchBehavior(userResult, {
          success: async (r) => {
            const passwordValid = await compare(input.password, r.value.passwordHash)
            if (!passwordValid) {
              return failAs("認証失敗", "unauthorized")
            }
            const tokenResult = await service.createAuthToken(context)({
              userId: r.value.id,
            })
            return matchBehavior(tokenResult, {
              success: (t) =>
                okAs("ログイン成功", {
                  value: { token: t.value.token, expiresAt: t.value.expiresAt },
                }),
              validation_failed: () => failAs("入力値が不正", "bad_request", { fields: {} }),
            })
          },
          not_found: () => failAs("認証失敗", "unauthorized"),
          validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
        })
      },
    }),
)
