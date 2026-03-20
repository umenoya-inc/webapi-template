import { type InferOutput, brand, date, object, pipe, string, uuid } from "valibot"
import { AuthTokenId } from "./AuthTokenId"

export const AuthToken = pipe(
  object({
    token: AuthTokenId,
    userId: pipe(string(), uuid()),
    expiresAt: date(),
    createdAt: date(),
  }),
  brand("AuthToken"),
)

export type AuthToken = InferOutput<typeof AuthToken>
