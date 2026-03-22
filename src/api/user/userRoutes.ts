import { Hono } from "hono"
import { getUserByIdRoute } from "./getUserByIdRoute"
import { listUsersRoute } from "./listUsersRoute"
import { postUserRoute } from "./postUserRoute"

/** ユーザー API のルートをまとめた Hono インスタンス。 */
export const userRoutes = new Hono()

userRoutes.route("/", postUserRoute)
userRoutes.route("/", listUsersRoute)
userRoutes.route("/", getUserByIdRoute)
