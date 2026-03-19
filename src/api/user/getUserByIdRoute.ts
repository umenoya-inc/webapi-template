import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { defineRoute } from "../defineRoute"
import { getUserById } from "./getUserById"

export const getUserByIdRoute = new Hono()

getUserByIdRoute.get(
  "/:id",
  ...defineRoute({
    fn: () => getUserById(globalDbContext),
    description: "ID を指定してユーザーを取得する",
  }),
)
