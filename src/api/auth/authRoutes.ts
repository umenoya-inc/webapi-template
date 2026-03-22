import { Hono } from "hono"
import { postLoginRoute } from "./postLoginRoute"

/** 認証 API のルートをまとめた Hono インスタンス。 */
export const authRoutes = new Hono()

authRoutes.route("/", postLoginRoute)
