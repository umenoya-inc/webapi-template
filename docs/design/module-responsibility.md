# モジュールの責務分離

## アーキテクチャ概要

```
src/
├── api/           # API ハンドラ + ルート定義（ドメインロジックを含む）
├── db/            # テーブル定義・ドメインモデル・CRUD 操作
├── behavior/      # 振る舞いパスの型表現基盤（インフラ）
├── contract/      # Valibot スキーマ検証付き関数定義（インフラ）
├── effect/        # 軽量 Effect System（インフラ）
├── testing/       # テスト・モックユーティリティ（インフラ）
├── envvar/        # 環境変数（インフラ）
└── index.ts       # Hono アプリケーションのエントリポイント
```

## db モジュール

`src/db/` はデータアクセスとドメインモデルを担う。

- サブモジュール（`db/user/`, `db/todo/` 等）にテーブル定義・ドメインモデル・操作関数を配置する
- 操作関数は `defineEffect` + `defineContract` で leaf effect（`context` のみ、`service` なし）として定義する — `effect-structure/no-service-in-db-effect` lint ルールで強制
- `okAs` / `failAs` でビジネス的な意味のあるラベルを付与する
- DB エラー（unique_violation 等）をビジネスエラーに翻訳するのもここの責務
- テストは PGlite を使った実 DB テスト

```
src/db/
├── user/
│   ├── User.ts              # ドメインモデル（Valibot スキーマ + Branded Type）
│   ├── UserId.ts            # Branded Entity ID
│   ├── userTable.ts         # Drizzle テーブル定義
│   ├── createUser.ts        # defineEffect + defineContract で CRUD + エラー判断
│   ├── createUser.test.ts   # PGlite で実 DB テスト
│   ├── findUserById.ts
│   └── index.ts             # barrel export
└── index.ts
```

## api モジュール

`src/api/` は API ハンドラとルート定義を担う。ドメインロジック（複数の DB 操作の組み合わせ、条件分岐等）もここに含む。

- ドメインごとにサブモジュール（`api/user/` 等）を作る
- ハンドラ（`postUser.ts`）は `defineEffect` で依存する Effect を `service` に宣言し（`effect-structure/no-leaf-in-api-effect` lint ルールで強制）、`defineRouteContract` でロジックを定義する。`responses` マップでステータスコードを宣言し、`fn` 内でビジネスロジックを記述する
- ルート集約（`userRoutes.ts`）はドメイン内の全ルートを `defineRoute` でまとめた Hono インスタンス。ハンドラロジック（RouteEffect）はモジュール内部でのみ使用し、barrel export しない

```
src/api/
├── user/
│   ├── postUser.ts          # defineEffect + defineRouteContract（ハンドラロジック）
│   ├── postUser.test.ts     # testBehavior でテスト（DB はモック）
│   ├── getUserById.ts
│   ├── listUsers.ts
│   ├── userRoutes.ts        # 全ルートの Hono セットアップを集約
│   └── index.ts             # barrel export（userRoutes のみ）
├── defineRoute.ts           # ルート生成ユーティリティ
├── defineRouteContract.ts   # ルート専用コントラクト
└── index.ts
```

### なぜ独立したドメイン層を持たないのか

`defineRouteContract` のハンドラはビジネスロジックそのもので、HTTP メタデータ（`responses` のステータスコード）は `fn` の外に宣言される。ハンドラの `fn` を剥がせば純粋なドメイン関数と等価であり、独立したドメイン層を設けるとパススルー関数が量産される。

複数のハンドラから共有されるロジックが出てきた場合は、api モジュール内にユーティリティとして切り出せばよく、層としてのアクセス制御は不要。

## テスト方針

| モジュール | テスト対象        | DB                                 |
| ---------- | ----------------- | ---------------------------------- |
| `db/*`     | CRUD + エラー判断 | PGlite（実 DB）                    |
| `api/*`    | ハンドラロジック  | モック（`mockService` で差し替え） |

`db/` が leaf effect のみに制限されることで、`db/` のテストは構造的に実 DB が必須になる（`mockService` でバイパスする手段がない）。`api/` のテストは `module-boundary` により DB テストインフラにアクセスできないため、モックが必須になる。
