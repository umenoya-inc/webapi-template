import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { createUser, findUserById, listUsers as dbListUsers } from "@/db/user"
import { authMiddleware, getAuthContext } from "../auth"
import { defineRoute } from "../defineRoute"
import { getUserById } from "./getUserById"
import { listUsers } from "./listUsers"
import { postUser } from "./postUser"

/** ユーザー API のルートをまとめた Hono インスタンス。 */
export const userRoutes = new Hono()

userRoutes.post(
  "/",
  ...defineRoute({
    effect: postUser,
    provide: () => ({
      service: { createUser },
      context: { db: globalDbContext },
    }),
    description: "ユーザーを新規作成する",
  }),
)

userRoutes.get(
  "/",
  ...defineRoute({
    effect: listUsers,
    provide: () => ({
      service: { listUsers: dbListUsers },
      context: { db: globalDbContext },
    }),
    description: "ユーザー一覧を取得する",
  }),
)

userRoutes.get(
  "/:id",
  ...defineRoute({
    effect: getUserById,
    middleware: [authMiddleware] as const,
    provide: (c) => ({
      service: { findUserById },
      context: { db: globalDbContext, auth: getAuthContext(c) },
    }),
    description: "ID を指定してユーザーを取得する",
  }),
)
