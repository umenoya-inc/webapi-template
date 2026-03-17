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
