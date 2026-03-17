# 関数指向のロジック設計

ビジネスロジックは参照透過なトップレベル関数として実装する。

## 原則

- 1関数 = 1ファイル（1ファイル1エクスポートルールに準拠）
- 副作用を持つ依存（DB操作関数、他モジュールの関数等）は、末尾の `env` 引数で受け取る。
- `env` にはデフォルト引数で実体を設定する。テスト時のみモックに差し替える。
- 通常の呼び出し側は `env` を意識しない。
- DB操作は `DbContext` を第一引数に取る関数として `db` モジュールから公開される。ビジネスロジック側は `env` 経由でこれらの関数を受け取る。

## 例

```typescript
// ✅ createTodo.ts（ビジネスロジック）
import type { DbContext } from "@/modules/db";
import type { Result } from "@/types/Result";
import type { Todo } from "./Todo";
import { findUserById } from "@/modules/db/user";
import { saveTodo } from "@/modules/db/todo";

export const createTodo = async (
  ctx: DbContext,
  title: string,
  assignee: string,
  env: {
    findUserById: typeof findUserById;
    saveTodo: typeof saveTodo;
  } = { findUserById, saveTodo },
): Promise<Result<Todo, "user_not_found">> => {
  const userResult = await env.findUserById(ctx, assignee);
  if (!userResult.ok) return { ok: false, error: "user_not_found" };
  return {
    ok: true,
    value: await env.saveTodo(ctx, {
      id: crypto.randomUUID(),
      title,
      completed: false,
      assignee,
    }),
  };
};

// ❌ env を使わず直接依存にアクセスする（テストで差し替えできない）
export const createTodo = async (ctx: DbContext, title: string, assignee: string) => {
  const user = await findUserById(ctx, assignee);
  // ...
};
```

## route 層からの呼び出し

```typescript
// routes/todoRoute.ts
import { dbContext, dbTransaction } from "@/modules/db";
import { createTodo } from "@/modules/todo";

// トランザクションなし
const result = await createTodo(dbContext, title, assignee);

// トランザクションあり
const result = await dbTransaction(async (ctx) => {
  return await createTodo(ctx, title, assignee);
});
```

## テストでの利用

```typescript
// env を差し替えてモックを注入する（DbContext もダミーで渡せる）
const result = await createTodo({} as DbContext, "Buy milk", "user-1", {
  findUserById: async (_ctx, id) => ({ ok: true, value: { id, name: "Alice" } }),
  saveTodo: async (_ctx, todo) => todo,
});
```
