import { email, maxLength, minLength, object, pipe, string, uuid } from "valibot"
import { Hono } from "hono"
import { globalDbContext } from "@/db"
import { defineRoute } from "./defineRoute"
import { postUser } from "./postUser"

export const userRoute = new Hono()

userRoute.post(
  "/",
  ...defineRoute({
    fn: () => postUser(globalDbContext),
    input: object({
      name: pipe(string(), minLength(1), maxLength(100)),
      email: pipe(string(), email()),
    }),
    output: object({
      id: pipe(string(), uuid()),
      name: string(),
      email: pipe(string(), email()),
    }),
    description: "ユーザーを新規作成する",
  }),
)
