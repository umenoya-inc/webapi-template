import { type InferOutput, brand, pipe, string, uuid } from "valibot"

export const UserId = pipe(string(), uuid(), brand("UserId"))

export type UserId = InferOutput<typeof UserId>
