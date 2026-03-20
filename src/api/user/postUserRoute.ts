import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { createUser } from "@/db/user"
import { defineRoute } from "../defineRoute"
import { postUser } from "./postUser"

export const postUserRoute = new Hono()

postUserRoute.post(
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
