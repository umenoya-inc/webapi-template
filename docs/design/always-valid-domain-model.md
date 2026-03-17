# Always Valid Domain Model

Valibot の Branded Types を活用し、バリデーション済みのデータのみがドメインモデルとして扱われることを型レベルで保証する。

## 目的

外部入力（リクエストボディ、クエリパラメータ、DB取得値など）を受け取る境界で必ずバリデーションを通し、以降のビジネスロジックでは常にバリデーション済みの型を前提にできるようにする。Branded Types により、バリデーションを経由していない生データをドメインモデル型に代入することがコンパイル時にエラーとなる。

## 方針

- 外部入力を受け取るすべての境界（route、外部API、DB取得）でバリデーションを行う
- ドメインモデルは Valibot スキーマ + `brand` で定義し、`InferOutput` で型を導出する
- ビジネスロジック層では Branded な型のみを受け取り、生データを直接扱わない

## 例

### スキーマとドメインモデルの定義

```typescript
// src/modules/db/user/User.ts
import {
  type InferOutput,
  brand,
  email,
  maxLength,
  minLength,
  object,
  pipe,
  string,
  uuid,
} from "valibot"

export const User = pipe(
  object({
    id: pipe(string(), uuid()),
    name: pipe(string(), minLength(1), maxLength(100)),
    email: pipe(string(), email()),
  }),
  brand("User"),
)

export type User = InferOutput<typeof User>
```

### 境界でのバリデーション

```typescript
// route 層: リクエストボディをバリデーション
import { safeParse } from "valibot"
import { User } from "@/modules/db/user"

const body = await c.req.json()
const parsed = safeParse(User, body)
if (!parsed.success) {
  return c.json({ error: "validation_failed" }, 400)
}
// parsed.output は User 型（Branded）
```

### ビジネスロジック層

```typescript
// ✅ Branded な型を受け取る — バリデーション済みが保証される
export const createUser = async (
  ctx: DbContext,
  user: User,
  env: { saveUser: typeof saveUser } = { saveUser },
) => {
  return await env.saveUser(ctx, user)
}

// ❌ 生のオブジェクトを User 型として渡す — コンパイルエラー
const raw = { id: "...", name: "Alice", email: "alice@example.com" }
await createUser(ctx, raw) // Type error: missing brand
```

### Value Object の定義

プリミティブな値にも Branded Types を適用し、取り違えを防ぐ。

```typescript
// src/modules/db/user/UserId.ts
import { type InferOutput, brand, pipe, string, uuid } from "valibot"

export const UserId = pipe(string(), uuid(), brand("UserId"))

export type UserId = InferOutput<typeof UserId>
```

```typescript
// UserId と OrderId を取り違えるとコンパイルエラー
import { parse } from "valibot"

declare function findUser(ctx: DbContext, id: UserId): Promise<...>
declare function findOrder(ctx: DbContext, id: OrderId): Promise<...>

const userId = parse(UserId, "...")
findOrder(ctx, userId) // ❌ Type error
```
