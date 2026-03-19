# ルートファイル

## ファイル構成

ルートはハンドラロジックとルート定義の2ファイルで構成する。対称性のある名前で対にする。

```
src/api/
├── postUser.ts          # ハンドラロジック（defineRouteContract）
├── postUserRoute.ts     # ルート定義（defineRoute）
├── getUserById.ts
├── getUserByIdRoute.ts
```

- ハンドラ: `postUser.ts` — `defineRouteContract` でロジックを定義。`testBehavior` でテスト可能
- ルート: `postUserRoute.ts` — `defineRoute` で Hono インスタンスを生成。エクスポートはこちらのみ

## defineRouteContract

`defineRouteContract` はルートハンドラのロジックを定義する。`defineContract` の拡張で、`responses` マップによるステータスコード宣言を含む。

- `input` — リクエストボディの Valibot スキーマ
- `output` — 成功レスポンスの Valibot スキーマ
- `responses` — Desc ラベルをキーとするステータスコードと説明のマップ。全ラベルの網羅が型で強制される
- `fn` — ハンドラロジック。`okAs` / `failAs` でラベル付きの結果を返す。ステータスコードは `responses` に定義するため `fn` 内には書かない

```typescript
// postUser.ts
export const postUser = (ctx: DbContext) =>
  defineRouteContract({
    input: object({ ... }),
    output: object({ ... }),
    responses: {
      "作成成功": { status: 201, description: "ユーザーを新規作成" },
      "メールアドレスが重複": { status: 409, description: "メールアドレスが既に使用されている" },
      "入力値が不正": { status: 400, description: "入力値が不正" },
    },
    fn: async (input) => {
      const result = await registerUser(ctx)(input)
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

## defineRoute

`defineRoute` はハンドラ関数からスキーマと `responses` マップを自動取得し、OpenAPI ドキュメント付きの Hono ハンドラを生成する。

- `fn` — `defineRouteContract` で定義したハンドラ関数を返す thunk
- `description` — OpenAPI の操作説明

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

## テスト

ハンドラは `BehaviorBrand` を持つため `testBehavior` でテストできる。

```typescript
// postUser.test.ts
testBehavior(postUser, {
  "作成成功": async (assert) => { ... },
  "メールアドレスが重複": async (assert) => { ... },
  "入力値が不正": async (assert) => { ... },
})
```
