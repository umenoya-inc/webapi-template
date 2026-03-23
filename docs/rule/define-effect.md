<!-- specdrift v1 -->

# defineEffect による副作用の宣言

<!-- source: src/effect/defineEffect.ts@307e0d67 -->

## ルール

副作用を持つ関数（DB 操作、他モジュールの関数呼び出し等）は `defineEffect` で定義する。

- DB 層の関数（leaf Effect）は `context` で `DbContext` を要求する
- API 層のハンドラは `service` で依存する Effect を宣言する。`context` は子 Effect から自動導出される
- `context` の型宣言には `requiredContext` ヘルパーを使用する

## 目的

- 副作用の依存関係を型レベルで明示し、`defineRoute` の `provide` で一括提供する
- テスト時は `mockService` で service を差し替え、`context` にはダミー値を渡す
- `env` パターン（デフォルト引数による依存注入）は使用しない

## DB 層（leaf Effect）

```typescript
import { requiredContext, defineEffect } from "@/effect"

export const createUser = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
    defineContract({
      input: object({ ... }),
      output: User,
      fn: async (input) => {
        const db = fromDbContext(context.db)
        const rows = await db.query((q) => q.select().from(userTable).where(...))
        // ...
      },
    }),
)
```

## API 層（service 依存）

```typescript
import { defineEffect } from "@/effect"

export const postUser = defineEffect(
  { service: { createUser } },
  (service) => (context) =>
    defineRouteContract({
      // ...
      fn: async (input) =>
        matchBehavior(await service.createUser(context)(input), {
          success: (r) => okAs("作成成功", { value: { ... } }),
          duplicate_entry: () => failAs("メールアドレスが重複", "conflict"),
          validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
        }),
    }),
)
```

## ルート定義での provide

```typescript
postUserRoute.post(
  "/",
  ...defineRoute({
    effect: postUser,
    provide: () => ({
      service: { createUser },
      context: { db: globalDbContext },
    }),
    description: "ユーザーを新規作成する",
  }),
)
```

<!-- /source -->

## Lint

- `effect-structure/no-service-in-db-effect` で db/ 内の composite effect を警告
- `effect-structure/no-leaf-in-api-effect` で api/ 内の leaf effect を警告
