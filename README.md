# Web API Template

Hono + TypeScript + Vite+ による Web API テンプレート。

人間とコーディングエージェントが協働し、品質を保ちながら高速にコードを書くためのフィードバック設計を重視している。関数の振る舞いパス（成功・失敗の分岐）を型レベルの Desc ラベルとして宣言し、テストケースの網羅・層間の分岐ハンドリング・OpenAPI ドキュメント生成をすべてコンパイル時に強制する。軽量 Effect System により副作用の依存関係を型レベルで合成し、DB 層から API ハンドラまで一貫した仕組みでテストと依存注入を実現する。エージェントが間違った方向に進んだとき、型チェック・lint・テストの順に高速なフィードバックが返る設計になっており、目視で発見したパターンを lint ルールに昇格させるサイクルが組み込まれている。

## 特徴

### 設計方針

- [Always Valid Domain Model](docs/design/always-valid-domain-model.md)
- [コーディングエージェントのための高速フィードバック設計](docs/design/agent-feedback-loop.md)
- [型によるテスト網羅の強制](docs/design/type-enforced-test-coverage.md)
- [型の展開コスト](docs/design/type-expansion-cost.md)
- [関数指向のロジック設計](docs/design/function-oriented-logic.md)
- [index.ts によるモジュールアクセス制御](docs/design/module-access-control.md)
- [モジュールの責務分離](docs/design/module-responsibility.md)

### ルール

- [1ファイル1エクスポート](docs/rule/one-export-per-file.md)
- [API エンドポイント](docs/rule/api-endpoint.md)
- [Branded Entity ID](docs/rule/branded-entity-id.md)
- [DB エラーハンドリング](docs/rule/db-error-handling.md)
- [JSDoc フォーマット](docs/rule/jsdoc-format.md)
- [Namespace Import の禁止](docs/rule/no-namespace-import.md)
- [defineContract の fn 内ルール](docs/rule/contract-fn-rule.md)
- [defineEffect による副作用の宣言](docs/rule/define-effect.md)
- [インフラ関数の戻り値型には名前付き interface を宣言する](docs/rule/named-return-type-for-infra.md)
- [エラーハンドリング](docs/rule/error-handling.md)
- [オブジェクト型には interface を使う](docs/rule/interface-for-object-types.md)
- [テーブル定義](docs/rule/table-definition.md)
- [テストファイル](docs/rule/test-file.md)
- [入力バリデーションシナリオの宣言](docs/rule/route-input-error.md)
- [名前のある型は直接書く](docs/rule/no-indirect-type-derivation.md)
- [モジュールの公開API制御](docs/rule/module-barrel-export.md)

## モジュール構成

- **api** — HTTP API のハンドラロジックとルート定義を提供する
  - **auth** — 認証に関する API ハンドラ、ルート定義、ミドルウェアを提供する
  - **todo** — TODO 管理の API ハンドラとルート定義を提供する
  - **user** — ユーザー管理の API ハンドラとルート定義を提供する
- **behavior** — 振る舞いパスの型表現とテスト網羅強制の基盤を提供する
- **contract** — Valibot スキーマによる入出力検証付き関数定義を提供する
- **db** — Drizzle ORM + node-postgres によるDBアクセスを提供する
  - **auth** — 認証トークンの永続化と検索を担当する
  - **todo** — TODO の永続化と取得を担当する
  - **user** — ユーザーの永続化と取得を担当する
- **effect** — 軽量 Effect System。副作用の依存宣言・自動合成・型レベルでの context 導出を提供する
- **envvar** — 環境変数を型安全に取得する
- **testing** — defineBehavior / defineContract / defineEffect ベースの関数に対するテスト・モック用ユーティリティを提供する

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
