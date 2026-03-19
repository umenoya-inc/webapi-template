import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { defineRoute } from "./defineRoute"
import { postUser } from "./postUser"

export const userRoute = new Hono()

userRoute.post(
  "/",
  ...defineRoute({
    fn: () => postUser(globalDbContext),
    description: "ユーザーを新規作成する",
  }),
)
