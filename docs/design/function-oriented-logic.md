# 関数指向のロジック設計

ビジネスロジックは参照透過なトップレベル関数として実装する。

## 原則

- 1関数 = 1ファイル（1ファイル1エクスポートルールに準拠）
- 副作用を持つ依存（DB、他モジュールの関数等）は、末尾の `env` 引数で受け取る。
- `env` にはデフォルト引数で実体を設定する。テスト時のみモックに差し替える。
- 通常の呼び出し側は `env` を意識しない。

## 例

```typescript
// ✅ createTodo.ts
import type { Result } from "@/types/Result";
import type { Todo } from "./Todo";
import { findUser } from "@/modules/user";

export const createTodo = async (
  title: string,
  assignee: string,
  env: {
    findUser: typeof findUser;
    saveTodo: (todo: Todo) => Promise<Todo>;
  },
): Promise<Result<Todo, "user_not_found">> => {
  const userResult = await env.findUser(assignee);
  if (!userResult.ok) return userResult;
  return {
    ok: true,
    value: await env.saveTodo({ id: crypto.randomUUID(), title, completed: false, assignee }),
  };
};

// ❌ env を使わず直接依存にアクセスする（テストで差し替えできない）
export const createTodo = async (title: string, assignee: string) => {
  const user = await db.users.get(assignee);
  // ...
};
```

## テストでの利用

```typescript
// env を差し替えてモックを注入する
const result = await createTodo("Buy milk", "user-1", {
  findUser: async (id) => ({ ok: true, value: { id, name: "Alice" } }),
  saveTodo: async (todo) => todo,
});
```
