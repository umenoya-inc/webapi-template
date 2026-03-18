# defineContract の fn 内エラー返却に as const を付ける

`defineContract` の `fn` 内でエラーオブジェクトを返す際は、オブジェクトリテラルに `as const` を付ける。

## 目的

`as const` がないと `reason` が `string` に widening され、戻り値の型から具体的なエラーケースを型レベルで識別できなくなる。`as const` を付けることで `reason` のリテラル型が保持され、呼び出し側での型安全な分岐や、テストにおける振る舞い別モックの自動導出が可能になる。

## 例

```typescript
export const createUser = (ctx: DbContext) =>
  defineContract({
    input: object({ ... }),
    output: User,
    fn: async (input) => {
      // ...
      if (error) {
        // ✅ as const でリテラル型を保持
        return {
          ok: false,
          reason: "duplicate_entry",
          field: "email",
        } as const
      }
      // ✅ 成功ケースも as const
      return {
        ok: true,
        value: { id: row.id, name: row.name, email: row.email },
      } as const
    },
  })
```

```typescript
// ❌ as const なし — reason: "duplicate_entry" が reason: string に広がる
return {
  ok: false,
  reason: "duplicate_entry",
  field: "email",
}
```
