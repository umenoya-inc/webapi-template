# Web API Template

Hono + TypeScript + Vite+ による Web API テンプレート。

エージェントコーディングに最適化された設計を目指している。型システムとスキーマ検証でランタイムの安全性を最大化し、不正な値がドメインロジックに到達しない構造を取る。エラーは戻り値として明示的に扱い、暗黙の例外フローを排除することで、呼び出し側がエラーケースを網羅的にハンドリングできるようにする。モジュール境界を厳格に保ち、内部実装の変更が外に漏れない構造で、大規模化しても安全にリファクタリングできることを重視する。

## 特徴

### 設計方針

- [Always Valid Domain Model](docs/design/always-valid-domain-model.md)
- [関数指向のロジック設計](docs/design/function-oriented-logic.md)
- [index.ts によるモジュールアクセス制御](docs/design/module-access-control.md)
- [モジュールの責務分離](docs/design/module-responsibility.md)
- [型によるテスト網羅の強制](docs/design/type-enforced-test-coverage.md)

### ルール

- [1ファイル1エクスポート](docs/rule/one-export-per-file.md)
- [モジュールの公開API制御](docs/rule/module-barrel-export.md)
- [Discriminated Unionによるエラーハンドリング](docs/rule/discriminated-union-error-handling.md)
- [Namespace Importの禁止](docs/rule/no-namespace-import.md)
- [テーブル定義](docs/rule/table-definition.md)
- [テストファイル](docs/rule/test-file.md)
- [DBエラーハンドリング](docs/rule/db-error-handling.md)
- [Branded Entity ID](docs/rule/branded-entity-id.md)
- [JSDoc フォーマット](docs/rule/jsdoc-format.md)
- [defineContract の fn 内で failAs / okAs を使う](docs/rule/contract-fn-as-const.md)

## モジュール構成

- **behavior** — 振る舞いパスの型表現とテスト網羅強制の基盤を提供する
- **contract** — Valibot スキーマによる入出力検証付き関数定義を提供する
- **db** — Drizzle ORM + node-postgres によるDBアクセスを提供する
  - **user** — ユーザーの永続化と取得を担当する
- **domain** — ビジネスロジックを配置するトップレベルモジュール
  - **user** — ユーザー管理のビジネスロジックを提供する
- **envvar** — 環境変数を型安全に取得する
- **testing** — defineBehavior / defineContract ベースの関数に対するテスト・モック用ユーティリティを提供する

## スクリプト

| コマンド          | 実行内容             |
| ----------------- | -------------------- |
| `npm run dev`     | `vp dev`             |
| `npm run build`   | `vp build`           |
| `npm run preview` | `node dist/index.js` |
| `npm run lint`    | `vp lint`            |
| `npm run fmt`     | `vp fmt`             |
| `npm run check`   | `vp check`           |
| `npm run test`    | `vp test`            |
| `npm run docs`    | `typedoc`            |

## セットアップ

### 1. Vite+ のインストール

```bash
curl -fsSL https://vite.plus | bash
```

インストーラーは `.bashrc` と `.profile` に環境設定を自動追記します。
zsh を使っている場合は、以下を `.zshrc` に手動で追記してください。

```bash
. "$HOME/.vite-plus/env"
```

追記後、ターミナルを再起動してください。

### 2. Node.js のセットアップ

`.node-version` に記載されたバージョンをインストールします。

```bash
vp env install
vp env pin
```

### 3. 依存関係のインストール

```bash
vp install
```
