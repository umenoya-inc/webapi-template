import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core"

export const authTokenTable = pgTable("auth_token", {
  token: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
