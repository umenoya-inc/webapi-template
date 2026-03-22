# エラーハンドリング

このプロジェクトのエラーは2種類に分かれる。想定内の失敗と、想定外のバグ。それぞれ処理方針が異なる。

## 例外と異常系: Let it crash

例外（throw）は想定外のバグにのみ使う。ビジネスロジック内で例外を catch してリカバリしてはならない。

例外が発生した場合、フレームワーク層で一律に以下を行う:

- HTTP 500 を返す
- エラー内容を構造化ログに出力する（スタックトレース、リクエスト情報等）

これは Erlang/OTP の「Let it crash」哲学に基づく。個々の関数でエラーをハンドリングしようとせず、クラッシュさせて上位層に復旧を任せる。Web アプリにおいては、リクエスト単位でクラッシュが隔離され、他のリクエストには影響しない。

```typescript
// ✅ 想定外のエラーはそのまま throw（catch しない）
throw new Error("Unexpected database error", { cause: result.error.cause })

// ❌ 想定外のエラーを catch してリカバリしようとしない
try {
  await someOperation()
} catch (e) {
  return { ok: false, reason: "unknown_error" } // バグを握りつぶしている
}
```

例外を catch してよいのはフレームワーク層（`defineRoute` 等）のみ。ビジネスロジックからは throw するだけでよい。

## 例外を DU に変換する境界層

外部ライブラリやドライバは例外で失敗を通知するものが多い。Let it crash の方針を貫徹するには、これらの例外をビジネスロジックに到達する前に DU に変換する境界層が必要になる。

境界層の責務:

- ライブラリ固有の例外を catch し、想定内のエラーを DU に変換する
- 想定外のエラー（変換できないもの）はそのまま throw して Let it crash に委ねる

```typescript
// DbClient.execute: 書き込み操作で PG エラーを PgResult (DU) に変換する境界層
const db = fromDbContext(context.db)
const result = await db.execute((q) =>
  q.insert(userTable).values({ name, email, passwordHash }).returning(),
)
if (!result.ok) {
  if (result.error.kind === "unique_violation") {
    return failAs("メールアドレスが既存ユーザーと重複", "duplicate_entry", { field: "email" })
    //     ↑ 想定内の DB エラー → ビジネスエラーに変換
  }
  throw new Error("Unexpected database error", { cause: result.error })
  // ↑ 想定外の DB エラー → Let it crash
}
```

`DbClient` は書き込み（`execute`）と読み取り（`query`）で異なるメソッドを提供する。`execute` は PG エラーを `PgResult` に変換し、`query` はそのまま throw する。境界層の実装は `DbClient` の内部に閉じ込められており、ビジネスロジックが直接 try/catch を書く必要はない。

新しい外部依存（外部 API クライアント、認証プロバイダ等）を導入する際は、同様の境界層を設けること。

## Discriminated Union と正常系

想定内の失敗は、例外を使わず Discriminated Union（判別可能なユニオン型）で表現する。

### 目的

エラーの発生箇所と処理箇所を型レベルで明示し、エラーの見落としを防ぐ。例外はコードの流れを追いにくくし、どの関数がどのエラーを投げるか型情報から判別できない。Discriminated Union を使うことで、呼び出し側は判別子（`ok` プロパティ等）による分岐を強制され、エラーケースの処理漏れをコンパイル時に検出できる。

### 使い分け

#### Fallible — ok のみを制約とする最小の型

`Fallible`（`@/types/Fallible`）は `{ ok: true } | { ok: false }` だけを制約とする型。カスタム Discriminated Union を受け入れる共通の上界として使う。直接の戻り値型としては使わず、`DbClient.transaction` のようにジェネリクスの制約（`F extends Fallible`）として利用する。

#### ReasonedFallible — reason を持つ Fallible

`ReasonedFallible`（`@/types/ReasonedFallible`）は `{ ok: true } | { ok: false; reason: string }` を制約とする型。`Fallible` を拡張し、失敗ケースに `reason` フィールドを要求する。`defineContract` のようにジェネリクスの制約として利用する。

#### カスタム Discriminated Union — 関数の戻り値型

関数の成功/失敗を表現するにはカスタムの Discriminated Union 型を定義する。

##### 制約

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
