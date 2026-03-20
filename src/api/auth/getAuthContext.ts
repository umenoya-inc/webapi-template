import type { Context } from "hono"
import type { AuthContext } from "./AuthContext"

/** Hono Context から AuthContext を取り出す。 */
export const getAuthContext = (c: Context): AuthContext => c.get("auth")
