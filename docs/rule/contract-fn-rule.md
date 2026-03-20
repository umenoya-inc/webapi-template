# defineContract の fn 内ルール

## failAs / okAs で返す

`defineContract` / `defineRouteContract` の `fn` 内でオブジェクトリテラルを返す際は、`failAs` / `okAs` を使用する。

### 目的

`failAs` / `okAs` は `Desc` ブランド型を付与し、リテラル型を保持する。`defineContract` は `fn` の戻り値に `Desc` ブランドを要求するため、素のオブジェクトリテラルを返すと型エラーになる。これにより、説明ラベルの付与とリテラル型の保持が型レベルで強制される。

### 例

```typescript
export const createUser = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
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
        return okAs("ユーザーを新規作成", { value: { id: row.id, name: row.name, email: row.email } })
      },
    }),
)
```

```typescript
// ❌ 素のオブジェクトリテラル — Desc ブランドがないため型エラー
return {
  ok: false,
  reason: "duplicate_entry",
  field: "email",
} as const
```

## matchBehavior で分岐する

`fn` 内で他の `defineContract` / `defineBehavior` 関数の結果を分岐する際は `matchBehavior` を使用する。

### 目的

`matchBehavior` は結果の全 variant を exhaustive に処理することを型で強制する。`if/else` による手動分岐では variant の追加・変更時に漏れが検出されない。

### 例

```typescript
// ✅ matchBehavior で exhaustive に分岐
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

```typescript
// ❌ if/else による手動分岐 — variant 追加時に漏れる可能性がある
fn: async (input) => {
  const result = await service.createUser(context)(input)
  if (!result.ok) {
    if (result.reason === "duplicate_entry") {
      return failAs("メールアドレスが重複", "conflict")
    }
    return failAs("入力値が不正", "bad_request", { fields: result.fields })
  }
  return okAs("作成成功", { value: { ... } })
}
```

```typescript
// ✅ 他の Contract からの結果をそのまま返す場合は matchBehavior 不要
return result
```
