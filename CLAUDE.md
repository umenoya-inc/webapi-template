# Rules

TypeScript ファイルを作成・編集する際は、以下のルールを必ず適用すること。

- [1ファイル1エクスポート](docs/rule/one-export-per-file.md)
- [モジュールの公開API制御](docs/rule/module-barrel-export.md)
- [Discriminated Unionによるエラーハンドリング](docs/rule/either-error-handling.md)
- [Namespace Importの禁止](docs/rule/no-namespace-import.md)
- [テーブル定義](docs/rule/table-definition.md)
- [テストファイル](docs/rule/test-file.md)

# Design

ビジネスロジックを実装する際は、以下の設計方針に従うこと。

- [関数指向のロジック設計](docs/design/function-oriented-logic.md)
- [Always Valid Domain Model](docs/design/always-valid-domain-model.md)

# Infrastructure

共通モジュールを利用・拡張する際は、各モジュールの `index.ts` のコードドキュメントを参照すること。

- [DBアクセス](src/modules/db/index.ts) — DbContext, トランザクション, DB操作関数の追加方法
- [環境変数](src/modules/envvar/index.ts) — 型安全な環境変数の取得・追加方法
- [Design by Contract](src/modules/contract/index.ts) — Valibot スキーマによる入出力検証付き関数定義

# Commit

コミットが必要な場合は `/commit` スキルの使用を提案すること。直接 `git commit` を実行しない。
