import type { Context } from "hono"
import type { AuthContext } from "./AuthContext"
import type { AuthEnv } from "./AuthEnv"

/** Hono Context から AuthContext を取り出す。authMiddleware が適用済みの Context でのみ呼べる。 */
export const getAuthContext = (c: Context<AuthEnv>): AuthContext => c.get("auth")
