import {
  type InferOutput,
  brand,
  email,
  maxLength,
  minLength,
  object,
  pipe,
  string,
  uuid,
} from "valibot"

export const User = pipe(
  object({
    id: pipe(string(), uuid()),
    name: pipe(string(), minLength(1), maxLength(100)),
    email: pipe(string(), email()),
  }),
  brand("User"),
)

export type User = InferOutput<typeof User>
