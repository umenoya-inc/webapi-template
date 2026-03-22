# Overview

Hono + Drizzle + Valibot + PGlite による TypeScript Web API のテンプレートプロジェクト。人間とコーディングエージェントが協働し、品質を保ちながら高速にコードを書くためのフィードバック設計を重視している。

上位方針: [コーディングエージェントのための高速フィードバック設計](docs/design/agent-feedback-loop.md)

# Rules

TypeScript ファイルを作成・編集する際は、以下のルールを必ず適用すること。
rule と design の区分基準は [rule と design の区分基準](docs/rule/rule-vs-design.md) を参照。

<!-- 並び順: ①他のルール/設計の前提になっているものが上（依存の深さ） ②同じ深さなら影響範囲が広いものが上。結果として、上のルールが下のルールを理解するための語彙・文脈を提供する読み順にもなっている -->

- [エラーハンドリング](docs/rule/error-handling.md)
- [defineEffect による副作用の宣言](docs/rule/define-effect.md)
- [1ファイル1エクスポート](docs/rule/one-export-per-file.md)
- [defineContract の fn 内ルール](docs/rule/contract-fn-rule.md)
- [モジュールの公開API制御](docs/rule/module-barrel-export.md)
- [Branded Entity ID](docs/rule/branded-entity-id.md)
- [DBエラーハンドリング](docs/rule/db-error-handling.md)
- [テーブル定義](docs/rule/table-definition.md)
- [API エンドポイント](docs/rule/api-endpoint.md)
- [テストファイル](docs/rule/test-file.md)
- [ルート入力バリデーションの宣言](docs/rule/route-input-error.md)
- [オブジェクト型には interface を使う](docs/rule/interface-for-object-types.md)
- [Namespace Importの禁止](docs/rule/no-namespace-import.md)
- [名前のある型は直接書く](docs/rule/no-indirect-type-derivation.md)
- [インフラ関数の戻り値型には名前付き interface を宣言する](docs/rule/named-return-type-for-infra.md)
- [JSDoc フォーマット](docs/rule/jsdoc-format.md)

# Design

ビジネスロジックを実装する際は、以下の設計方針に従うこと。

<!-- 並び順: ①他の設計/ルールの前提になっているものが上（依存の深さ） ②同じ深さなら影響範囲が広いものが上 -->

- [関数指向のロジック設計](docs/design/function-oriented-logic.md)
- [Always Valid Domain Model](docs/design/always-valid-domain-model.md)
- [モジュールの責務分離](docs/design/module-responsibility.md)
- [index.ts によるモジュールアクセス制御](docs/design/module-access-control.md)
- [型によるテスト網羅の強制](docs/design/type-enforced-test-coverage.md)
- [型の展開コスト](docs/design/type-expansion-cost.md)

# Guide

新しいドメイン機能を追加する際は、以下のガイドに従うこと。

- [新規ドメイン機能の追加](docs/guide/add-domain-feature.md) — DB 層からAPI 層・テストまでの一気通貫の手順

# Infrastructure

共通モジュールを利用・拡張する際は、各モジュールの `index.ts` のコードドキュメントを参照すること。

- [Behavior](src/behavior/index.ts) — 振る舞いパスの型表現、テスト網羅強制、Desc ラベル
- [Contract](src/contract/index.ts) — Valibot スキーマによる入出力検証付き関数定義（behavior の上に構築）
- [Effect](src/effect/index.ts) — 軽量 Effect System（defineEffect, requiredContext, resolveEffects）
- [DBアクセス](src/db/index.ts) — DbContext, トランザクション, DB操作関数の追加方法
- [環境変数](src/envvar/index.ts) — 型安全な環境変数の取得・追加方法

# Tool Usage

- Glob でファイルを検索する際は `path` パラメータに `src/` や `docs/` 等の対象ディレクトリを指定すること。`path` を省略すると `node_modules` の結果で溢れ、本来のファイルを見落とす
- 特定のファイルがルートに存在するか確認するだけなら `ls` を使う

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
