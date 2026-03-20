import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { findUserById } from "@/db/user"
import { authMiddleware, getAuthContext } from "../auth"
import { defineRoute } from "../defineRoute"
import { getUserById } from "./getUserById"

export const getUserByIdRoute = new Hono()

getUserByIdRoute.get(
  "/:id",
  authMiddleware,
  ...defineRoute({
    effect: getUserById,
    provide: (c) => ({
      service: { findUserById },
      context: { db: globalDbContext, auth: getAuthContext(c) },
    }),
    description: "ID を指定してユーザーを取得する",
  }),
)
