import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const todoTable = pgTable("todo", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
