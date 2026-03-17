# 関数指向のロジック設計

ビジネスロジックは参照透過なトップレベル関数として実装する。

## 原則

- 1関数 = 1ファイル（1ファイル1エクスポートルールに準拠）
- `defineContract` で入出力のバリデーションを行う。ビジネスロジック層のほとんどの関数で使用する。
- `DbContext` と `env` は外側の関数の引数として受け取り、`defineContract` 内の `fn` からはクロージャ経由でアクセスする。
- 副作用を持つ依存（DB操作関数、他モジュールの関数等）は `env` 引数で受け取る。
- `env` にはデフォルト引数で実体を設定する。テスト時のみモックに差し替える。
- 通常の呼び出し側は `env` を意識しない。

## 例

```typescript
// ✅ createTodo.ts（ビジネスロジック）
import type { DbContext } from "@/modules/db"
import { flatten, minLength, object, pipe, string, uuid } from "valibot"
import { defineContract } from "@/modules/contract"
import { findUserById } from "@/modules/db/user"
import { saveTodo } from "@/modules/db/todo"
import { Todo } from "./Todo"

export const createTodo = (
  ctx: DbContext,
  env: {
    findUserById: typeof findUserById
    saveTodo: typeof saveTodo
  } = { findUserById, saveTodo },
) =>
  defineContract({
    input: object({
      title: pipe(string(), minLength(1)),
      assignee: pipe(string(), uuid()),
    }),
    output: Todo,
    onInputError: (issues) =>
      ({
        ok: false,
        reason: "validation_failed",
        fields: flatten(issues).nested ?? {},
      }) as const,
    fn: async (input) => {
      // ctx, env はクロージャ経由でアクセス
      const user = await env.findUserById(ctx)({ id: input.assignee })
      if (!user.ok) return { ok: false, reason: "user_not_found" } as const
      return {
        ok: true,
        value: { id: crypto.randomUUID(), title: input.title, assignee: input.assignee },
      }
    },
  })

// ❌ defineContract を使わない（バリデーションなし）
// ❌ env を使わず直接依存にアクセスする（テストで差し替えできない）
```

## route 層からの呼び出し

```typescript
// routes/todoRoute.ts
import { globalDbContext, dbTransaction } from "@/modules/db"
import { createTodo } from "@/modules/todo"

// トランザクションなし
const result = await createTodo(globalDbContext)({ title, assignee })

// トランザクションあり
const result = await dbTransaction(async (ctx) => {
  return await createTodo(ctx)({ title, assignee })
})
```

## テストでの利用

```typescript
// env を差し替えてモックを注入する（DbContext もダミーで渡せる）
const result = await createTodo({} as DbContext, {
  findUserById: (_ctx) => async (_input) => ({
    ok: true,
    value: { id: "user-1", name: "Alice" },
  }),
  saveTodo: (_ctx) => async (input) => ({ ok: true, value: input }),
})({ title: "Buy milk", assignee: "user-1" })
```
