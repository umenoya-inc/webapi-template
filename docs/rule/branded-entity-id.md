# Branded Entity ID

DB に永続化されたエンティティの ID は Branded Types で定義し、「DB に存在が確認された ID」と「未確認の文字列」を型レベルで区別する。

## 目的

- 存在が確認されていない ID をエンティティ間の参照に使うことをコンパイル時に防ぐ
- 異なるエンティティの ID（UserId と OrderId など）の取り違えを防ぐ
- Branded ID を受け取る関数では参照先の存在チェックを省略でき、呼び出し側のエラーハンドリングを簡素化できる

## 方針

### Branded ID の定義

エンティティごとに `{Entity}Id` を Valibot の `brand` で定義する。

```typescript
// src/modules/db/user/UserId.ts
import { type InferOutput, brand, pipe, string, uuid } from "valibot"

export const UserId = pipe(string(), uuid(), brand("UserId"))

export type UserId = InferOutput<typeof UserId>
```

### エンティティ型への組み込み

エンティティのスキーマでは `id` フィールドに Branded ID を使う。`defineContract` の output を通過した時点で ID にもブランドが付与される。

```typescript
export const User = pipe(
  object({
    id: UserId,
    name: pipe(string(), minLength(1), maxLength(100)),
    email: pipe(string(), email()),
  }),
  brand("User"),
)
```

### 検索の入力はプレーンな文字列

`findUserById` のように「存在するか調べる」操作の入力はブランドなしの `pipe(string(), uuid())` を使う。存在が未確定の段階で Branded ID を要求しない。

```typescript
// ✅ 入力はプレーンな文字列 — 存在未確定
defineContract({
  input: object({ id: pipe(string(), uuid()) }),
  output: User,
  fn: async (input) => { ... },
})
```

### 他エンティティからの参照

あるエンティティが別のエンティティを参照する場合、参照先の Branded ID を使う。これにより、参照先が DB に存在する ID であることが型で保証される。

```typescript
// ✅ assigneeId は UserId — DB に存在するユーザーの ID のみ受け付ける
export const Todo = pipe(
  object({
    id: TodoId,
    title: pipe(string(), minLength(1)),
    assigneeId: UserId,
  }),
  brand("Todo"),
)
```

### Branded ID による存在チェックの省略

Branded ID を引数に取る関数は、その ID が DB に存在するエンティティから取得されたことが型で保証されている。そのため参照先が見つからない場合はデータ不整合（プログラムバグ）として `throw` でよく、呼び出し側に `not_found` のハンドリングを強いる必要がない。

```typescript
// ✅ UserId は存在確認済み — not_found はデータ不整合として throw
const assignUser = async (ctx: DbContext, todoId: TodoId, userId: UserId) => {
  const result = await findUserById(ctx)({ id: userId })
  if (!result.ok) {
    throw new Error("User not found: data inconsistency")
  }
  // ...
}
```

```typescript
// 呼び出し側は not_found を気にせずに済む
await assignUser(ctx, todoId, user.id) // user.id は User から取得した UserId
```

## Lint

型チェックで強制。Branded Type の不一致はコンパイルエラーになるため lint 化不要。
