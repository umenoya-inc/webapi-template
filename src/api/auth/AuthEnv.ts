import type { AuthContext } from "./AuthContext"

/** authMiddleware が Hono Context に設定する Variables の型。 */
export interface AuthEnv {
  Variables: { auth: AuthContext }
}
