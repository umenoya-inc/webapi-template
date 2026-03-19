# defineContract の fn 内で failAs / okAs を使う

`defineContract` の `fn` 内でオブジェクトリテラルを返す際は、`failAs` / `okAs` を使用する。

## 目的

`failAs` / `okAs` は `Desc` ブランド型を付与し、リテラル型を保持する。`defineContract` は `fn` の戻り値に `Desc` ブランドを要求するため、素のオブジェクトリテラルを返すと型エラーになる。これにより、説明ラベルの付与とリテラル型の保持が型レベルで強制される。

## 例

```typescript
import { defineContract, failAs, okAs } from "@/modules/contract"

export const createUser = (ctx: DbContext) =>
  defineContract({
    input: object({ ... }),
    output: User,
    fn: async (input) => {
      // ...
      if (error) {
        // ✅ failAs で説明付きエラー値を返す
        return failAs("メールアドレスが既存ユーザーと重複", "duplicate_entry", { field: "email" })
      }
      // ✅ okAs で説明付き成功値を返す
      return okAs("ユーザーを新規作成", { id: row.id, name: row.name, email: row.email })
    },
  })
```

```typescript
// ❌ 素のオブジェクトリテラル — Desc ブランドがないため型エラー
return {
  ok: false,
  reason: "duplicate_entry",
  field: "email",
} as const
```

```typescript
// ✅ 他の Contract からの結果をそのまま返す場合は failAs / okAs 不要
return result
```
