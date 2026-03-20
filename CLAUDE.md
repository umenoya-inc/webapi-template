# Rules

TypeScript ファイルを作成・編集する際は、以下のルールを必ず適用すること。
rule と design の区分基準は [rule と design の区分基準](docs/rule/rule-vs-design.md) を参照。

- [1ファイル1エクスポート](docs/rule/one-export-per-file.md)
- [モジュールの公開API制御](docs/rule/module-barrel-export.md)
- [Discriminated Unionによるエラーハンドリング](docs/rule/discriminated-union-error-handling.md)
- [Namespace Importの禁止](docs/rule/no-namespace-import.md)
- [テーブル定義](docs/rule/table-definition.md)
- [テストファイル](docs/rule/test-file.md)
- [DBエラーハンドリング](docs/rule/db-error-handling.md)
- [Branded Entity ID](docs/rule/branded-entity-id.md)
- [JSDoc フォーマット](docs/rule/jsdoc-format.md)
- [defineContract の fn 内ルール](docs/rule/contract-fn-rule.md)
- [API エンドポイント](docs/rule/api-endpoint.md)
- [ルート入力バリデーションの宣言](docs/rule/route-input-error.md)
- [名前のある型は直接書く](docs/rule/no-indirect-type-derivation.md)

# Design

ビジネスロジックを実装する際は、以下の設計方針に従うこと。

- [関数指向のロジック設計](docs/design/function-oriented-logic.md)
- [Always Valid Domain Model](docs/design/always-valid-domain-model.md)
- [モジュールの責務分離](docs/design/module-responsibility.md)
- [index.ts によるモジュールアクセス制御](docs/design/module-access-control.md)
- [型によるテスト網羅の強制](docs/design/type-enforced-test-coverage.md)

# Infrastructure

共通モジュールを利用・拡張する際は、各モジュールの `index.ts` のコードドキュメントを参照すること。

- [Behavior](src/behavior/index.ts) — 振る舞いパスの型表現、テスト網羅強制、Desc ラベル
- [Contract](src/contract/index.ts) — Valibot スキーマによる入出力検証付き関数定義（behavior の上に構築）
- [DBアクセス](src/db/index.ts) — DbContext, トランザクション, DB操作関数の追加方法
- [環境変数](src/envvar/index.ts) — 型安全な環境変数の取得・追加方法

# Commands

すべてのコマンドは `vp` (vite-plus) 経由で実行すること。vitest 等を直接実行しない。

- コードチェック: `npx vp check --fix`
- テスト: `npx vp test`
- テスト（フィルタ付き）: `npx vp test run src/db/user/`
- ビルド: `npx vp build`
- 開発サーバー: `npx vp dev`

# Ideas

保存しておいた方がよさそうなアイディアが出てきた場合は `/save-idea` スキルの使用を提案すること。

# Commit

コミットが必要な場合は `/commit` スキルの使用を提案すること。直接 `git commit` を実行しない。
