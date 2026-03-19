import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { defineRoute } from "../defineRoute"
import { postUser } from "./postUser"

export const postUserRoute = new Hono()

postUserRoute.post(
  "/",
  ...defineRoute({
    fn: () => postUser(globalDbContext),
    description: "ユーザーを新規作成する",
  }),
)
