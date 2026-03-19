# モジュールの責務分離

## アーキテクチャ概要

```
src/
├── api/           # API ハンドラ + ルート定義（ドメインロジックを含む）
├── db/            # テーブル定義・ドメインモデル・CRUD 操作
├── behavior/      # 振る舞いパスの型表現基盤（インフラ）
├── contract/      # Valibot スキーマ検証付き関数定義（インフラ）
├── testing/       # テスト・モックユーティリティ（インフラ）
├── envvar/        # 環境変数（インフラ）
└── index.ts       # Hono アプリケーションのエントリポイント
```

## db モジュール

`src/db/` はデータアクセスとドメインモデルを担う。

- サブモジュール（`db/user/`, `db/todo/` 等）にテーブル定義・ドメインモデル・操作関数を配置する
- 操作関数は `defineContract` で定義し、`okAs` / `failAs` でビジネス的な意味のあるラベルを付与する
- DB エラー（unique_violation 等）をビジネスエラーに翻訳するのもここの責務
- テストは PGlite を使った実 DB テスト

```
src/db/
├── user/
│   ├── User.ts              # ドメインモデル（Valibot スキーマ + Branded Type）
│   ├── UserId.ts            # Branded Entity ID
│   ├── userTable.ts         # Drizzle テーブル定義
│   ├── createUser.ts        # defineContract で CRUD + エラー判断
│   ├── createUser.test.ts   # PGlite で実 DB テスト
│   ├── findUserById.ts
│   └── index.ts             # barrel export
└── index.ts
```

## api モジュール

`src/api/` は API ハンドラとルート定義を担う。ドメインロジック（複数の DB 操作の組み合わせ、条件分岐等）もここに含む。

- ドメインごとにサブモジュール（`api/user/` 等）を作る
- ハンドラ（`postUser.ts`）は `defineRouteContract` で定義。`responses` マップでステータスコードを宣言し、`fn` 内でビジネスロジックを記述する
- ルート定義（`postUserRoute.ts`）は `defineRoute` で Hono インスタンスを生成する薄いアダプタ
- ハンドラとルート定義は対称的な名前でペアにする
- DB 操作は `env` パターンで注入し、テスト時にモック可能にする

```
src/api/
├── user/
│   ├── postUser.ts          # defineRouteContract（ハンドラロジック）
│   ├── postUser.test.ts     # testBehavior でテスト（DB はモック）
│   ├── postUserRoute.ts     # defineRoute（ルート定義）
│   └── index.ts
├── defineRoute.ts           # ルート生成ユーティリティ
├── defineRouteContract.ts   # ルート専用コントラクト
└── index.ts
```

### なぜ独立したドメイン層を持たないのか

`defineRouteContract` のハンドラはビジネスロジックそのもので、HTTP メタデータ（`responses` のステータスコード）は `fn` の外に宣言される。ハンドラの `fn` を剥がせば純粋なドメイン関数と等価であり、独立したドメイン層を設けるとパススルー関数が量産される。

複数のハンドラから共有されるロジックが出てきた場合は、api モジュール内にユーティリティとして切り出せばよく、層としてのアクセス制御は不要。

## テスト方針

| モジュール | テスト対象        | DB                       |
| ---------- | ----------------- | ------------------------ |
| `db/*`     | CRUD + エラー判断 | PGlite（実 DB）          |
| `api/*`    | ハンドラロジック  | モック（`env` 差し替え） |
