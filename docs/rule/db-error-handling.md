# DB エラーハンドリング

DB 操作で発生するドライバ固有のエラーは `dbExecute` を通じて正規化された `DbError` 型に変換する。DB 操作関数はドライバのエラー構造に直接依存しない。

## 目的

- ドライバ（node-postgres, PGlite 等）ごとのエラー構造の差異を吸収する
- DB エラーの種別判定をドメインロジックから分離する
- ドライバ変更時の影響を `dbExecute` 内部に閉じ込める

## 使い方

DB 操作関数では Drizzle のクエリを `dbExecute` でラップし、返された `DbError` をドメイン固有のエラーに変換して返す。

```typescript
import { dbExecute } from "../error/dbExecute"

const result = await dbExecute(() => db.insert(userTable).values({ name, email }).returning())
if (!result.ok) {
  if (result.error.kind === "unique_violation") {
    return { ok: false, reason: "duplicate_entry", field: "email" as const }
  }
  // 想定外の DB エラーは throw（プログラムバグ扱い）
  throw new Error("Unexpected database error", { cause: result.error.cause })
}
```

## 禁止事項

- `dbExecute` を経由せずに Drizzle のクエリを直接 try/catch しない
- `DbError` をそのまま外部に返さない。ドメインの意味に変換してから返す

## DbError の拡張

新しい PostgreSQL エラーコードへの対応が必要になった場合は、`dbExecute.ts` 内の `normalizePgError` と `DbError` 型に追加する。
