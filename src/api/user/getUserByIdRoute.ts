import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { findUserById } from "@/db/user"
import { defineRoute } from "../defineRoute"
import { getUserById } from "./getUserById"

export const getUserByIdRoute = new Hono()

getUserByIdRoute.get(
  "/:id",
  ...defineRoute({
    effect: getUserById,
    provide: () => ({
      service: { findUserById },
      context: { db: globalDbContext },
    }),
    description: "ID を指定してユーザーを取得する",
  }),
)
