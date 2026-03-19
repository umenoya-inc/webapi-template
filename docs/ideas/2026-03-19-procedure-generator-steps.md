# Generator による手続き的ステップの型表現

## 概要

`defineContract` の `fn` 内の手続きを Generator の `yield*` で分解し、各ステップの接続点に型を付ける。エラー型は `yield*` により自動的に union として蓄積され、手続き的な書き味を保ちながら中間の意味が型に現れるようになる。

## コードイメージ

```typescript
type Step<E, A> = AsyncGenerator<E, A, undefined>

fn: (input) =>
  procedure(async function* () {
    const db = fromDbContext(ctx)
    const rows = await db.select().from(userTable).where(eq(userTable.id, input.id))

    const row = yield* requireOne(rows, "not_found")
    //    ^^^ Row — ここに来た時点で「DBに存在した」ことが型で保証

    return { id: row.id, name: row.name, email: row.email }
  })

// procedure の戻り値型（自動推論）:
// Promise<
//   | { ok: true; value: { id: string; name: string; email: string } }
//   | { ok: false; reason: "not_found" }
// >
```

## 利点

- **手続き的な書き味を保持** — `function*` + `yield*` 以外は通常の async コードと同じ
- **エラー型の自動合流** — 複数の `yield*` の Yield 型が自動で union になる
- **中間の型が見える** — `yield*` の戻り値で「このステップを通過した」ことが型レベルで表現される
- **非線形依存に対応** — pipe と違い、前のステップの値を後のステップで自由に参照できる

## Desc パターンとの組み合わせ

[Desc ブランド型パターン](./2026-03-19-desc-phantom-type.md)が実装済み。Generator のステップヘルパー（`requireOne` 等）が Desc ラベル付きの `failAs` を内部で使えば、`yield*` で伝播するエラーにも自動的に説明ラベルが付く。手続き的なステップの接続点に型 + 説明が両方乗る形になる。

## 課題

- `async function*()` + `yield*` の構文コスト（見慣れなさ）
- AsyncGenerator の TypeScript 型推論がどこまで正確に動くか要検証
- 既存の defineContract との統合方法の設計
