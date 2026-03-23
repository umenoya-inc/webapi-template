<!-- specdrift v1 -->

# DB エラーハンドリング

<!-- source: src/db/DbClient.ts@b67db1ae -->

DB 操作で発生するドライバ固有のエラーは `DbClient` を通じて正規化された `DbError` 型に変換する。DB 操作関数はドライバのエラー構造に直接依存しない。

## 目的

- ドライバ（node-postgres, PGlite 等）ごとのエラー構造の差異を吸収する
- DB エラーの種別判定をドメインロジックから分離する
- ドライバ変更時の影響を `DbClient` 内部に閉じ込める

## DbClient の使い分け

`fromDbContext` が返す `DbClient` は、書き込み / 読み取りで異なるメソッドを使う。

| メソッド  | 用途                                 | PG エラー         | 戻り値                 |
| --------- | ------------------------------------ | ----------------- | ---------------------- |
| `execute` | 書き込み（insert / update / delete） | `PgResult` に変換 | `Promise<PgResult<T>>` |
| `query`   | 読み取り（select）                   | そのまま throw    | `Promise<T>`           |

### 書き込み（execute）

`execute` は PG エラーを `PgResult` に変換する。返された `DbError` をドメイン固有のエラーに変換して返す。

```typescript
const db = fromDbContext(context.db)
const result = await db.execute((q) =>
  q.insert(userTable).values({ name, email, passwordHash }).returning(),
)
if (!result.ok) {
  if (result.error.kind === "unique_violation") {
    return failAs("メールアドレスが既存ユーザーと重複", "duplicate_entry", { field: "email" })
  }
  // 想定外の DB エラーは throw（プログラムバグ扱い）
  throw new Error("Unexpected database error", { cause: result.error })
}
```

特定の PG エラーをハンドリングしない書き込み操作でも `execute` を使う。

```typescript
const result = await db.execute((q) =>
  q.insert(todoTable).values({ title: input.title }).returning(),
)
if (!result.ok) {
  throw new Error("Unexpected database error", { cause: result.error })
}
```

### 読み取り（query）

`query` は結果を直接返す。PG エラー（接続断等）は例外として伝播する。

```typescript
const db = fromDbContext(context.db)
const rows = await db.query((q) => q.select().from(userTable).where(eq(userTable.id, input.id)))
```

## 禁止事項

- `fromDbContext` が返す `DbClient` を経由せずに Drizzle のクエリを直接実行しない
- `query` 内で書き込み操作（insert / update / delete）を行わない — `db-safety/no-write-in-query` lint ルールで強制
- `DbError` をそのまま外部に返さない。ドメインの意味に変換してから返す

## DbError の拡張

新しい PostgreSQL エラーコードへの対応が必要になった場合は、`pgExecute.ts` 内の `normalizePgError` と `DbError` 型に追加する。

<!-- /source -->

## Lint

- `db-safety/no-write-in-query` で `query` 内の書き込み操作を禁止
- `DbClient` のアーキテクチャにより `fromDbContext` 経由でしか DB アクセスできない構造で強制
