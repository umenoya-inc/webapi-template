import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { createAuthToken } from "@/db/auth"
import { findUserByEmail } from "@/db/user"
import { defineRoute } from "../defineRoute"
import { postLogin } from "./postLogin"

/** 認証 API のルートをまとめた Hono インスタンス。 */
export const authRoutes = new Hono()

authRoutes.post(
  "/",
  ...defineRoute({
    effect: postLogin,
    provide: () => ({
      service: { findUserByEmail, createAuthToken },
      context: { db: globalDbContext },
    }),
    description: "ログインしてアクセストークンを取得する",
  }),
)
