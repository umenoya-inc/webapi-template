import { type InferOutput, brand, minLength, object, pipe, string } from "valibot"
import { TodoId } from "./TodoId"

export const Todo = pipe(
  object({
    id: TodoId,
    title: pipe(string(), minLength(1)),
  }),
  brand("Todo"),
)

export type Todo = InferOutput<typeof Todo>
