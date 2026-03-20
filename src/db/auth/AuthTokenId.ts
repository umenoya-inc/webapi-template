import { type InferOutput, brand, pipe, string, uuid } from "valibot"

export const AuthTokenId = pipe(string(), uuid(), brand("AuthTokenId"))

export type AuthTokenId = InferOutput<typeof AuthTokenId>
