# モジュールの責務分離

## db モジュール

`src/modules/db/` は CRUD レベルの DB 操作に徹する。ビジネスロジックは含めない。

- サブモジュール（`db/user/`, `db/order/` 等）にテーブル定義・ドメインモデル・操作関数を配置する
- 操作関数は単一テーブルへの INSERT / SELECT / UPDATE / DELETE が中心
- テストは PGlite を使った実 DB テスト（`*.testutil.ts` で DbContext を生成）

## ビジネスロジックモジュール

`src/modules/user/`, `src/modules/todo/` 等のトップレベルモジュールにビジネスロジックを実装する。

- `defineContract` + `env` パターンで DB 操作関数を依存注入する
- 複数の DB 操作を組み合わせたワークフロー、条件分岐、権限チェック等をここに書く
- テストは `env` 経由で db モジュールの公開関数をモックする。実 DB にはアクセスしない

## 例

```
src/modules/
├── db/                  # CRUD 操作（実 DB テスト）
│   ├── user/
│   │   ├── User.ts
│   │   ├── userTable.ts
│   │   ├── createUser.ts
│   │   ├── createUser.test.ts      # PGlite で実 DB テスト
│   │   └── findUserById.ts
│   └── todo/
│       ├── Todo.ts
│       ├── todoTable.ts
│       └── saveTodo.ts
├── user/                # ユーザー関連のビジネスロジック
│   ├── registerUser.ts
│   └── registerUser.test.ts        # db 関数をモックしてテスト
└── todo/                # ToDo 関連のビジネスロジック
    ├── createTodo.ts
    └── createTodo.test.ts           # db 関数をモックしてテスト
```

## テスト方針

| モジュール | テスト対象       | DB                       |
| ---------- | ---------------- | ------------------------ |
| `db/*`     | CRUD 操作        | PGlite（実 DB）          |
| それ以外   | ビジネスロジック | モック（`env` 差し替え） |
