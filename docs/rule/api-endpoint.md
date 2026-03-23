<!-- specdrift v1 -->

# API エンドポイント

## ファイル構成

エンドポイントはハンドラロジックとルート集約の構成で、ドメインごとのサブモジュールに配置する。ハンドラロジック（RouteEffect）はモジュール内部でのみ使用し、barrel export しない。外部には `*Routes` のみ公開する。

```
src/api/
├── user/
│   ├── postUser.ts          # ハンドラロジック（defineEffect + defineRouteContract）
│   ├── postUser.test.ts     # テスト
│   ├── getUserById.ts
│   ├── getUserById.test.ts
│   ├── listUsers.ts
│   ├── userRoutes.ts        # 全ルートの Hono セットアップを集約（defineRoute）
│   └── index.ts             # barrel export（userRoutes のみ）
└── index.ts
```

### 命名規則

- ハンドラ: `<method><Resource>.ts` — 例: `postUser.ts`, `getUserById.ts`
- ルート集約: `<domain>Routes.ts` — 例: `userRoutes.ts`
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

<!-- source: src/api/defineRoute.ts@88ddc384, src/api/defineRouteContract.ts@eef346ce -->

ドメインごとの `*Routes.ts` に全ルートの Hono セットアップを集約する。`defineRoute` に `effect` と `provide` を渡してハンドラを生成する。ハンドラのスキーマと `responses` は自動取得されるため、記述は最小限。

`provide` の `service` にはハンドラの `defineEffect` で宣言した Effect と同じものを渡す。ハンドラ側が依存の**宣言**、ルート定義側が実体の**注入**であり、役割が異なるため重複ではない。

```typescript
// userRoutes.ts
export const userRoutes = new Hono()

userRoutes.post(
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

userRoutes.get(
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

### ルートの登録

`src/index.ts` にはドメイン単位でマウントする。

```typescript
// src/index.ts
app.route("/users", userRoutes)
app.route("/auth", authRoutes)
```

<!-- /source -->

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
5. ドメインの `*Routes.ts` に `defineRoute` でルートを追加
6. 新しいドメインの場合は `*Routes.ts` と `index.ts` を作成し、`src/index.ts` にマウント
7. `testBehavior` でテストを書く

## Lint

- `effect-structure/no-leaf-in-api-effect` で api/ 内の leaf effect を警告
- `module-boundary` で barrel export のアクセス制御を強制
- ファイル命名規則（`<method><Resource>.ts`）: lint 化対象外（ユーティリティファイルとの区別が AST だけでは困難なため）
