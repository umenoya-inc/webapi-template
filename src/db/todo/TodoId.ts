import { type InferOutput, brand, pipe, string, uuid } from "valibot"

export const TodoId = pipe(string(), uuid(), brand("TodoId"))

export type TodoId = InferOutput<typeof TodoId>
