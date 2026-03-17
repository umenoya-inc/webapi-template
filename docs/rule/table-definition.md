# テーブル定義

Drizzle ORM のテーブル定義は `src/modules/db/` 配下のサブモジュールに配置する。

## 命名規約

- テーブル名は**単数形**を原則とする（`"user"`, `"todo"`, `"order"`）
- ファイル名は `*Table.ts`、シンボル名は `*Table` とする（`userTable.ts` / `userTable`）
- drizzle-kit は `src/modules/db/**/*Table.ts` をスキーマとして認識する

## 公開範囲

- テーブル定義（`*Table`）は barrel export に含めない。DB操作関数が同一サブモジュール内から相対パスでアクセスする
- ドメインモデル（Valibot Branded Type）は barrel export で公開する

## 例

```
src/modules/db/user/
├── index.ts        # User（ドメインモデル）のみ公開
├── userTable.ts    # テーブル定義（非公開）
├── User.ts         # Valibot Branded Type（公開）
└── findUserById.ts # DB操作関数（公開）
```

```typescript
// userTable.ts — テーブル定義
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const userTable = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
```
