# 関数指向のロジック設計

ビジネスロジックは参照透過なトップレベル関数として実装する。

## 原則

- 1関数 = 1ファイル（1ファイル1エクスポートルールに準拠）
- `defineContract` で入出力のバリデーションを行う。ビジネスロジック層のほとんどの関数で使用する。
- 副作用を持つ依存は `defineEffect` で宣言する。DB 層は `context` で `DbContext` を要求し、API 層は `service` で依存する Effect を宣言する。
- テスト時は `mockService` で service を差し替え、`context` にはダミー値を渡す。

## 例

```typescript
// ✅ createTodo.ts（ビジネスロジック — API 層）
import { defineEffect } from "@/effect"
import { defineRouteContract } from "@/api/defineRouteContract"
import { findUserById } from "@/db/user"
import { saveTodo } from "@/db/todo"

export const createTodo = defineEffect(
  { service: { findUserById, saveTodo } },
  (service) => (context) =>
    defineRouteContract({
      input: object({
        title: pipe(string(), minLength(1)),
        assignee: pipe(string(), uuid()),
      }),
      output: Todo,
      responses: {
        "作成成功": { status: 201, description: "TODO を新規作成" },
        "ユーザーが見つからない": { status: 404, description: "担当者が存在しない" },
        "入力値が不正": { status: 400, description: "入力値が不正" },
      },
      fn: async (input) => {
        const user = await service.findUserById(context)({ id: input.assignee })
        return matchBehavior(user, {
          success: () => okAs("作成成功", { value: { ... } }),
          not_found: () => failAs("ユーザーが見つからない", "not_found"),
          validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
        })
      },
    }),
)

// ❌ defineEffect を使わず引数で依存を受け取る
// ❌ defineContract を使わない（バリデーションなし）
```

## ルート定義での provide

```typescript
// routes/createTodoRoute.ts
createTodoRoute.post(
  "/",
  ...defineRoute({
    effect: createTodo,
    provide: () => ({
      service: { findUserById, saveTodo },
      context: { db: globalDbContext },
    }),
    description: "TODO を新規作成する",
  }),
)
```

## テストでの利用

```typescript
// service をモックに差し替える（context にはダミー値を渡す）
const findUserByIdMock = mockBehavior(findUserById, {
  "IDに該当するユーザーを取得": async () => ({ ok: true, value: { ... } }),
  // ...
})

testBehavior(createTodo, {
  "作成成功": async (assert) => {
    const service = mockService(createTodo, {
      findUserById: findUserByIdMock["IDに該当するユーザーを取得"],
      saveTodo: saveTodoMock["保存成功"],
    })
    const result = await createTodo(service)({ db: dummyCtx })({ title: "Buy milk", assignee: "user-1" })
    const ok = assert(result)
    // ...
  },
})
```

## 参考

- [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) — Scott Wlaschin による関数指向のドメインモデリング。クラスではなく関数でドメインロジックを表現するアプローチの基盤
- [Dependency Injection Principles, Practices, and Patterns](https://www.manning.com/books/dependency-injection-principles-practices-patterns) — Mark Seemann による依存注入の原則。`defineEffect` による依存宣言はこの考え方に基づく
