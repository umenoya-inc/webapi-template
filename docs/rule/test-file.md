# テストファイル

## テストの配置

テストファイルはテスト対象と同じディレクトリに `*.test.ts` として配置する。

```
src/modules/db/user/
├── createUser.ts          # テスト対象
├── createUser.test.ts     # テストファイル
```

## テストユーティリティ

テスト専用のユーティリティは `*.testutil.ts` として定義する。`*.testutil.ts` は `*.test.ts` または他の `*.testutil.ts` からのみインポートできる。通常のコードからインポートすると lint エラーになる。

テストユーティリティの整理が必要な場合は `testing/` サブモジュールに配置する。

```
src/modules/db/
├── testing/
│   └── createTestDbContext.testutil.ts   # DB テスト用ヘルパー
├── user/
│   ├── createUser.ts
│   └── createUser.test.ts
```

## Discriminated Union の型絞り込み

テストで Discriminated Union の判別子（`ok` 等）を検証した後、型を絞り込むには `expect.unreachable()` を使う。early return は使わない。

`expect.unreachable()` は戻り値が `never` 型のため TypeScript の型絞り込みが効き、到達した場合はテストを即座に失敗させる。

```typescript
// ✅ expect.unreachable() で型を絞り込む
const result = await createUser(ctx)({ name: "Alice", email: "alice@example.com" })
expect(result.ok).toBe(true)
if (!result.ok) expect.unreachable("result should be ok")
expect(result.value.name).toBe("Alice")

// ❌ early return は使わない
if (!result.ok) return
```

## テスト変更時の JSDoc 更新

テストファイルを新規作成または更新した場合は、`/test-to-doc` スキルで対応するソースファイルの JSDoc を再生成する。
