# API エンドポイント

## ファイル構成

エンドポイントはハンドラロジックとルート定義の2ファイルで構成し、ドメインごとのサブモジュールに配置する。

```
src/api/
├── user/
│   ├── postUser.ts          # ハンドラロジック（defineEffect + defineRouteContract）
│   ├── postUser.test.ts     # テスト
│   ├── postUserRoute.ts     # ルート定義（defineRoute）
│   ├── getUserById.ts
│   ├── getUserById.test.ts
│   ├── getUserByIdRoute.ts
│   ├── userRoutes.ts        # ドメイン内のルートを集約
│   └── index.ts             # barrel export（ハンドラ + userRoutes）
└── index.ts
```

### 命名規則

- ハンドラ: `<method><Resource>.ts` — 例: `postUser.ts`, `getUserById.ts`
- ルート定義: `<method><Resource>Route.ts` — 例: `postUserRoute.ts`
- テスト: `<method><Resource>.test.ts` — ハンドラと同じディレクトリ

## ハンドラロジック（defineEffect + defineRouteContract）

ハンドラは `defineEffect` で依存を宣言し、`defineRouteContract` でロジックを定義する。

- `service` — 依存する Effect を宣言する。`context` は子 Effect から自動導出される
- `input` — リクエストの Valibot スキーマ（API レベル）
- `output` — 成功レスポンスの Valibot スキーマ（API レベル）
- `responses` — Desc ラベルをキーとするステータスコードと説明のマップ。全ラベルの網羅が型で強制される
- `fn` — ハンドラロジック。ステータスコードは `responses` に定義するため `fn` 内には書かない

```typescript
// postUser.ts
export const postUser = defineEffect(
  { service: { createUser } },
  (service) => (context) =>
    defineRouteContract({
      input: object({ ... }),
      output: object({ ... }),
      responses: {
        "作成成功": { status: 201, description: "ユーザーを新規作成" },
        "メールアドレスが重複": { status: 409, description: "メールアドレスが既に使用されている" },
        "入力値が不正": { status: 400, description: "入力値が不正" },
      },
      fn: async (input) =>
        matchBehavior(await service.createUser(context)(input), {
          success: (r) => okAs("作成成功", { value: { ... } }),
          duplicate_entry: () => failAs("メールアドレスが重複", "conflict"),
          validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
        }),
    }),
)
```

## ルート定義（defineRoute）

ルート定義は `defineRoute` で Hono インスタンスを生成する。`effect` に Effect を渡し、`provide` で service と context を提供する。ハンドラのスキーマと `responses` は自動取得されるため、記述は最小限。

`provide` の `service` にはハンドラの `defineEffect` で宣言した Effect と同じものを渡す。ハンドラ側が依存の**宣言**、ルート定義側が実体の**注入**であり、役割が異なるため重複ではない。

```typescript
// postUserRoute.ts
export const postUserRoute = new Hono()

postUserRoute.post(
  "/",
  ...defineRoute({
    effect: postUser,
    provide: () => ({
      service: { createUser },
      context: { db: globalDbContext },
    }),
    description: "ユーザーを新規作成する",
  }),
)
```

### ミドルウェア

認証などのミドルウェアは `middleware` オプションで渡す。ミドルウェアが Hono Context に設定する Variables の型が `provide` の `c` に反映されるため、ミドルウェアなしで `getAuthContext(c)` を呼ぶとコンパイルエラーになる。

```typescript
// getUserByIdRoute.ts
getUserByIdRoute.get(
  "/:id",
  ...defineRoute({
    effect: getUserById,
    middleware: [authMiddleware] as const,
    provide: (c) => ({
      service: { findUserById },
      context: { db: globalDbContext, auth: getAuthContext(c) },
    }),
    description: "ID を指定してユーザーを取得する",
  }),
)
```

### provide の型安全

`provide` の戻り値は `defineRoute` のジェネリクスにより Effect の `ProvideService` / `ProvideContext` で型制約される。service や context のフィールドが不足していればコンパイルエラーになる。`middleware` で指定したミドルウェアの Env 型は `provide` の `c` パラメータに反映される。

### ルートの集約

個別のルート定義（`postUserRoute` 等）はドメインごとの `*Routes.ts` にまとめ、`src/index.ts` にはドメイン単位でマウントする。個別ルート定義は barrel export しない（`*Routes.ts` 内の相対 import でのみ使用）。

```typescript
// api/user/userRoutes.ts
export const userRoutes = new Hono()
userRoutes.route("/", postUserRoute)
userRoutes.route("/", listUsersRoute)
userRoutes.route("/", getUserByIdRoute)

// src/index.ts
app.route("/users", userRoutes)
app.route("/auth", authRoutes)
```

## テスト

ハンドラは `BehaviorBrand` を持つため `testBehavior` でテストできる。依存する Effect は `mockBehavior` でモックを作成し、`mockService` で注入する。

```typescript
// postUser.test.ts
const createUserMock = mockBehavior(createUser, {
  "ユーザーを新規作成": async (input) => ({ ... }),
  "メールアドレスが既存ユーザーと重複": async () => ({ ... }),
  "入力値が不正": async () => ({ ... }),
})

testBehavior(postUser, {
  "作成成功": async (assert) => {
    const service = mockService(postUser, {
      createUser: createUserMock["ユーザーを新規作成"],
    })
    const result = await postUser(service)({ db: dummyCtx })({ ... })
    const ok = assert(result)
    expect(ok.value.name).toBe("Alice")
  },
  "メールアドレスが重複": async (assert) => { ... },
  "入力値が不正": propertyCheck(postUser, {
    "nameが空": { name: constant("") },
    "emailが不正": { email: string() },
  }, async (assert, input) => {
    const service = mockService(postUser, {
      createUser: createUserMock["入力値が不正"],
    })
    const result = await postUser(service)({ db: dummyCtx })(input)
    assert(result)
  }),
})
```

## エンドポイント追加の手順

1. `src/api/<domain>/` にハンドラファイルを作成（`defineEffect` + `defineRouteContract`）
2. `service` で依存する Effect を宣言
3. `responses` マップでステータスコードと説明を宣言
4. `fn` 内で `service` 経由で DB 操作関数を呼び出しビジネスロジックを記述
5. ルート定義ファイルを作成（`defineRoute` に `effect` と `provide` を渡す）
6. ドメインの `*Routes.ts` にルートを追加
7. ハンドラを `index.ts` の barrel export に追加（ルート定義は追加しない）
8. 新しいドメインの場合は `src/index.ts` に `app.route()` でマウント
9. `testBehavior` でテストを書く
