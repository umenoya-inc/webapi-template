import { type InferOutput, brand, email, maxLength, minLength, object, pipe, string } from "valibot"
import { UserId } from "./UserId"

export const User = pipe(
  object({
    id: UserId,
    name: pipe(string(), minLength(1), maxLength(100)),
    email: pipe(string(), email()),
  }),
  brand("User"),
)

export type User = InferOutput<typeof User>
