# Discriminated Unionによるエラーハンドリング

正常系のエラーハンドリングは、例外（throw）を使わず Discriminated Union（判別可能なユニオン型）で行う。

## 目的

エラーの発生箇所と処理箇所を型レベルで明示し、エラーの見落としを防ぐ。例外はコードの流れを追いにくくし、どの関数がどのエラーを投げるか型情報から判別できない。Discriminated Union を使うことで、呼び出し側は判別子（`ok` プロパティ等）による分岐を強制され、エラーケースの処理漏れをコンパイル時に検出できる。

## 使い分け

### Result<T, E> — シンプルな成功/失敗

エラーコードだけで十分なケースでは `Result<T, E>`（`@/types/Result`）を使う。`E` は任意の型。

```typescript
import type { Result } from "@/types/Result"

const findUser = async (ctx: DbContext, id: string): Promise<Result<User, "not_found">> => {
  // ...
}

const result = await findUser(ctx, id)
if (!result.ok) {
  // result.error: "not_found"
  return c.json({ error: result.error }, 404)
}
```

### カスタム Discriminated Union — 詳細な分岐が必要な場合

エラーケースが3つ以上ある場合や、各エラーに固有の追加情報を持たせたい場合は、カスタムの Discriminated Union 型を定義する。

#### 制約

- 成功ケースは `ok: true` を持つ
- 失敗ケースは `ok: false` と `reason: リテラル型string` を持つ
- `reason` はエラーの種類を表す分岐用ラベル。呼び出し側は `reason` で switch/if 分岐する
- `reason` 以外のフィールドは各ケースで自由に定義してよい

```typescript
// ✅ カスタム DU の定義
type CreateOrderResult =
  | { ok: true; value: Order }
  | { ok: false; reason: "user_not_found"; userId: string }
  | { ok: false; reason: "out_of_stock"; productId: string; available: number }
  | { ok: false; reason: "credit_exceeded"; limit: number; requested: number }

// ✅ 呼び出し側: reason で分岐すると各ケースの固有フィールドが型安全に使える
const result = await createOrder(ctx, input)
if (!result.ok) {
  switch (result.reason) {
    case "user_not_found":
      return c.json({ error: result.reason, userId: result.userId }, 404)
    case "out_of_stock":
      return c.json({ error: result.reason, available: result.available }, 409)
    case "credit_exceeded":
      return c.json({ error: result.reason, limit: result.limit }, 403)
  }
}
```

## 例外を使ってよいケース

- 予期しないプログラムエラー（バグ）
- フレームワーク側が例外を要求する場合
