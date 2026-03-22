# オブジェクト型には interface を使う

## ルール

オブジェクト型（`{ ... }` のみで構成される型）を宣言するときは `interface` を使う。それ以外の型宣言には `type` を使う。

## 目的

- **LSP hover の可読性:** `interface` は hover で名前のみ表示され、型が展開されない。ネストが深い型の truncation を防ぐ
- **AI ツールのトークン効率:** 型展開が抑制されることで、hover 経由の型情報取得時のトークン消費を削減する
- **エラーメッセージの明瞭さ:** 型不一致のエラーで構造体が展開されず、名前で表示される

## 例

```typescript
// ✅ オブジェクト型 → interface
interface AuthContext {
  userId: string
}
```

```typescript
// ✅ union 型 → type
type DbError = { kind: "unique_violation"; field: string } | { kind: "unknown"; cause: unknown }
```

```typescript
// ✅ mapped / conditional 型 → type
type ResolvedService<Service> = {
  [K in keyof Service]: Service[K] extends EffectBrand<any, any, infer C, infer F>
    ? { context: C; fn: F }
    : never
}
```

```typescript
// ❌ オブジェクト型に type を使っている
type AuthContext = {
  userId: string
}
```

## `type` を使う場面

以下は `interface` では表現できないため `type` を使う。

- **union 型:** `A | B`
- **mapped / conditional 型:** `{ [K in ...]: ... }`, `T extends U ? X : Y`
- **branded / phantom 型:** `T & { readonly [brand]: ... }`
- **推論型:** `InferOutput<typeof Schema>` 等、他の型から導出される型
- **プリミティブ / タプル / リテラル / 関数型**
