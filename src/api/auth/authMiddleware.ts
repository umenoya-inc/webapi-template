import { createMiddleware } from "hono/factory"
import { globalDbContext } from "@/db"
import { findAuthToken } from "@/db/auth"

/** Bearer トークンによる認証ミドルウェア。 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header("Authorization")
  if (!authorization?.startsWith("Bearer ")) {
    return c.json({ ok: false, reason: "unauthorized" }, 401)
  }
  const token = authorization.slice(7)
  const result = await findAuthToken({ db: globalDbContext })({ token })
  if (!result.ok) {
    return c.json({ ok: false, reason: "unauthorized" }, 401)
  }
  c.set("auth", { userId: result.value.userId })
  await next()
})
