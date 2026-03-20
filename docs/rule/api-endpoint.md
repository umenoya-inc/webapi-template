# API エンドポイント

## ファイル構成

エンドポイントはハンドラロジックとルート定義の2ファイルで構成し、ドメインごとのサブモジュールに配置する。

```
src/api/
├── user/
│   ├── postUser.ts          # ハンドラロジック（defineRouteContract）
│   ├── postUser.test.ts     # テスト
│   ├── postUserRoute.ts     # ルート定義（defineRoute）
│   ├── getUserById.ts
│   ├── getUserById.test.ts
│   ├── getUserByIdRoute.ts
│   └── index.ts             # barrel export
└── index.ts
```

### 命名規則

- ハンドラ: `<method><Resource>.ts` — 例: `postUser.ts`, `getUserById.ts`
- ルート定義: `<method><Resource>Route.ts` — 例: `postUserRoute.ts`
- テスト: `<method><Resource>.test.ts` — ハンドラと同じディレクトリ

## ハンドラロジック（defineRouteContract）

ハンドラは `defineRouteContract` で定義する。

- `input` — リクエストの Valibot スキーマ（API レベル）
- `output` — 成功レスポンスの Valibot スキーマ（API レベル）
- `responses` — Desc ラベルをキーとするステータスコードと説明のマップ。全ラベルの網羅が型で強制される
- `fn` — ハンドラロジック。ステータスコードは `responses` に定義するため `fn` 内には書かない
- DB 操作は `env` パターンで注入し、テスト時にモック可能にする

```typescript
// postUser.ts
export const postUser = (
  ctx: DbContext,
  env: { createUser: typeof createUser } = { createUser },
) =>
  defineRouteContract({
    input: object({ ... }),
    output: object({ ... }),
    responses: {
      "作成成功": { status: 201, description: "ユーザーを新規作成" },
      "メールアドレスが重複": { status: 409, description: "メールアドレスが既に使用されている" },
      "入力値が不正": { status: 400, description: "入力値が不正" },
    },
    fn: async (input) => {
      const result = await env.createUser(ctx)(input)
      if (!result.ok) {
        if (result.reason === "duplicate_entry") {
          return failAs("メールアドレスが重複", "conflict")
        }
        return failAs("入力値が不正", "bad_request", { fields: result.fields })
      }
      return okAs("作成成功", { value: { ... } })
    },
  })
```

## ルート定義（defineRoute）

ルート定義は `defineRoute` で Hono インスタンスを生成する。ハンドラのスキーマと `responses` を自動取得するため、記述は最小限。

```typescript
// postUserRoute.ts
export const postUserRoute = new Hono()

postUserRoute.post(
  "/",
  ...defineRoute({
    fn: () => postUser(globalDbContext),
    description: "ユーザーを新規作成する",
  }),
)
```

ルート定義を作成したら `src/index.ts` に登録する。

## テスト

ハンドラは `BehaviorBrand` を持つため `testBehavior` でテストできる。DB 操作は `env` パターンで `mockBehavior` に差し替える。

```typescript
// postUser.test.ts
const createUserMock = mockBehavior(createUser, {
  "ユーザーを新規作成": async (input) => ({ ... }),
  "メールアドレスが既存ユーザーと重複": async () => ({ ... }),
  "入力値が不正": async () => ({ ... }),
})

testBehavior(postUser, {
  "作成成功": async (assert) => {
    const env = mockEnv(postUser, {
      createUser: createUserMock["ユーザーを新規作成"],
    })
    const result = await postUser(dummyCtx, env)({ ... })
    const ok = assert(result)
    expect(ok.value.name).toBe("Alice")
  },
  "メールアドレスが重複": async (assert) => { ... },
  "入力値が不正": propertyCheck(postUser, {
    "nameが空": { name: constant("") },
    "emailが不正": { email: string() },
  }, async (assert, input) => {
    const result = await postUser(dummyCtx)(input)
    assert(result)
  }),
})
```

## エンドポイント追加の手順

1. `src/api/<domain>/` にハンドラファイルを作成（`defineRouteContract`）
2. `responses` マップでステータスコードと説明を宣言
3. `fn` 内で DB 操作関数を呼び出しビジネスロジックを記述。DB 操作は `env` で注入
4. ルート定義ファイルを作成（`defineRoute`）
5. `index.ts` の barrel export に追加
6. `src/index.ts` にルートを登録
7. `testBehavior` でテストを書く
