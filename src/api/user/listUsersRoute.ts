import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { listUsers as dbListUsers } from "@/db/user"
import { defineRoute } from "../defineRoute"
import { listUsers } from "./listUsers"

export const listUsersRoute = new Hono()

listUsersRoute.get(
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
