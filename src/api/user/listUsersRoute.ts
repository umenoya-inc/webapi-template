import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { defineRoute } from "../defineRoute"
import { listUsers } from "./listUsers"

export const listUsersRoute = new Hono()

listUsersRoute.get(
  "/",
  ...defineRoute({
    fn: () => listUsers(globalDbContext),
    description: "ユーザー一覧を取得する",
  }),
)
