# 新規ドメイン機能の追加ガイド

DB 層からAPI 層・テストまで、新しいドメイン機能を追加する手順を示す。`todo` ドメインの追加を例として使う。

## 前提知識

このガイドは手順に集中する。各ステップの設計判断やルールの詳細は以下を参照すること。

- [モジュールの責務分離](../design/module-responsibility.md) — DB 層と API 層の役割分担
- [Always Valid Domain Model](../design/always-valid-domain-model.md) — Branded Types による型安全
- [index.ts によるモジュールアクセス制御](../design/module-access-control.md) — カプセル化の仕組み

## 全体の流れ

```
Step 1: DB 層の実装
  1-1. テーブル定義
  1-2. Branded Entity ID
  1-3. ドメインモデル
  1-4. DB 操作関数
  1-5. DB 層テスト
  1-6. barrel export

Step 2: API 層の実装
  2-1. ハンドラロジック
  2-2. API 層テスト
  2-3. ルート集約
  2-4. barrel export
  2-5. メインアプリにマウント
```

各ステップで `npx vp check --fix` と `npx vp test` を実行し、問題がないことを確認しながら進める。

---

## Step 1: DB 層の実装

### 1-1. テーブル定義

`src/db/todo/todoTable.ts` を作成する。

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const todoTable = pgTable("todo", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
```

**参照:** [テーブル定義ルール](../rule/table-definition.md)

- テーブル名は単数形（`"todo"`）
- テーブル定義は barrel export に含めない

### 1-2. Branded Entity ID

`src/db/todo/TodoId.ts` を作成する。

```typescript
import { type InferOutput, brand, pipe, string, uuid } from "valibot"

export const TodoId = pipe(string(), uuid(), brand("TodoId"))

export type TodoId = InferOutput<typeof TodoId>
```

**参照:** [Branded Entity ID ルール](../rule/branded-entity-id.md)

### 1-3. ドメインモデル

`src/db/todo/Todo.ts` を作成する。

```typescript
import { type InferOutput, brand, minLength, object, pipe, string } from "valibot"
import { TodoId } from "./TodoId"

export const Todo = pipe(
  object({
    id: TodoId,
    title: pipe(string(), minLength(1)),
  }),
  brand("Todo"),
)

export type Todo = InferOutput<typeof Todo>
```

- `id` フィールドには Branded Entity ID を使う
- `defineContract` の output を通過した時点で Brand が付与される

### 1-4. DB 操作関数

`src/db/todo/createTodo.ts` を作成する。DB 操作関数は `defineEffect` + `defineContract` で定義する。

```typescript
import { failAs, okAs } from "@/behavior"
import { defaultInputError, defineContract } from "@/contract"
import { requiredContext, defineEffect } from "@/effect"
import { minLength, object, pipe, string } from "valibot"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { pgExecute } from "../error/pgExecute"
import { Todo } from "./Todo"
import { todoTable } from "./todoTable"

/** TODO を新規作成する */
export const createTodo = defineEffect(
  { context: requiredContext<{ db: DbContext }>() },
  (context) =>
    defineContract({
      input: object({
        title: pipe(string(), minLength(1)),
      }),
      output: Todo,
      onInputError: defaultInputError(["titleが空"]),
      fn: async (input) => {
        const db = fromDbContext(context.db)
        const result = await pgExecute(() =>
          db.insert(todoTable).values({ title: input.title }).returning(),
        )
        if (!result.ok) {
          throw new Error("Unexpected database error", { cause: result.error.cause })
        }
        const row = result.value[0]
        return okAs("TODOを新規作成", {
          value: { id: row.id, title: row.title },
        })
      },
    }),
)
```

**ポイント:**

- `context: requiredContext<{ db: DbContext }>()` で DB アクセスを宣言する
- DB クエリは `pgExecute` でラップする（[DB エラーハンドリング](../rule/db-error-handling.md)）
- `okAs` / `failAs` でビジネスラベルを付与する（[contract fn ルール](../rule/contract-fn-rule.md)）
- `input` がある場合は `onInputError` が必須（[入力バリデーションシナリオ](../rule/route-input-error.md)）

**DB エラーをビジネスエラーに翻訳する例（unique 制約がある場合）:**

```typescript
if (!result.ok) {
  if (result.error.kind === "unique_violation") {
    return failAs("タイトルが重複", "duplicate_entry", { field: "title" })
  }
  throw new Error("Unexpected database error", { cause: result.error.cause })
}
```

### 1-5. DB 層テスト

`src/db/todo/createTodo.test.ts` を作成する。DB 層は PGlite を使った実 DB テスト。

```typescript
import { describe, expect, afterAll, beforeAll } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { testBehavior, propertyCheck } from "@/testing"
import { createTodo } from "./createTodo"
import { todoTable } from "./todoTable"

describe("createTodo", () => {
  let ctx: DbContext
  let cleanup: () => Promise<void>

  beforeAll(async () => {
    const result = await createTestDbContext({ todoTable })
    ctx = result.ctx
    cleanup = result.cleanup
  }, 30000)

  afterAll(async () => {
    await cleanup?.()
  })

  testBehavior(createTodo, {
    "TODOを新規作成": async (assert) => {
      const result = await createTodo({ db: ctx })({ title: "買い物" })
      const ok = assert(result)
      expect(ok.value.title).toBe("買い物")
    },
    "入力値が不正": propertyCheck(
      createTodo,
      {
        "titleが空": { title: constant("") },
      },
      async (assert, input) => {
        const result = await createTodo({ db: ctx })(input)
        assert(result)
      },
    ),
  })
})
```

**テストの書き方:**

- `testBehavior` のキーは実装の `okAs` / `failAs` ラベルから導出される（全ラベル網羅が型で強制）
- DB 層の関数は `context` を直接渡して呼び出す: `createTodo({ db: ctx })(input)`
- 入力バリデーションは `propertyCheck` でシナリオごとにテスト

**参照:** [テストファイルルール](../rule/test-file.md)

### 1-6. barrel export

`src/db/todo/index.ts` を作成する。

```typescript
/**
 * @packageDocumentation
 * ## todo サブモジュール
 *
 * TODO の永続化と取得を担当する。
 *
 * ### エクスポート
 * - `TodoId` — Branded な TODO ID 型
 * - `Todo` — Branded な TODO 型
 * - `createTodo` — TODO を新規作成する
 */

export { TodoId } from "./TodoId"
export { Todo } from "./Todo"
export { createTodo } from "./createTodo"
```

- テーブル定義（`todoTable`）は公開しない
- JSDoc でモジュールの責務とエクスポート一覧を記述する

**参照:** [モジュールの公開API制御](../rule/module-barrel-export.md)

ここで `npx vp check --fix` と `npx vp test` を実行して DB 層が正常に動作することを確認する。

---

## Step 2: API 層の実装

### 2-1. ハンドラロジック

`src/api/todo/postTodo.ts` を作成する。ハンドラは `defineEffect` + `defineRouteContract` で定義する。

```typescript
import { failAs, matchBehavior, okAs } from "@/behavior"
import { defaultInputError } from "@/contract"
import { defineRouteContract } from "../defineRouteContract"
import { defineEffect } from "@/effect"
import { createTodo } from "@/db/todo"
import { email, minLength, object, pipe, string, uuid } from "valibot"

/** TODO を新規作成する API ハンドラ */
export const postTodo = defineEffect(
  { service: { createTodo } },
  (service) => (context) =>
    defineRouteContract({
      input: object({
        title: pipe(string(), minLength(1)),
      }),
      output: object({
        id: pipe(string(), uuid()),
        title: string(),
      }),
      onInputError: defaultInputError(["titleが空"]),
      responses: {
        "作成成功": { status: 201, description: "TODO を新規作成" },
        "入力値が不正": { status: 400, description: "入力値が不正" },
      },
      fn: async (input) =>
        matchBehavior(await service.createTodo(context)(input), {
          success: (r) =>
            okAs("作成成功", {
              value: { id: r.value.id, title: r.value.title },
            }),
          validation_failed: (r) => failAs("入力値が不正", "bad_request", { fields: r.fields }),
        }),
    }),
)
```

**DB 層との違い:**

|             | DB 層            | API 層                                |
| ----------- | ---------------- | ------------------------------------- |
| Effect 定義 | `context` のみ   | `service` で子 Effect を宣言          |
| Contract    | `defineContract` | `defineRouteContract`                 |
| 追加の宣言  | —                | `responses`（ステータスコードマップ） |
| 結果の分岐  | —                | `matchBehavior` で子の結果を翻訳      |

**ポイント:**

- `service: { createTodo }` で依存する Effect を宣言する
- `context` は子 Effect（`createTodo`）から自動導出されるため、明示不要
- `responses` マップで全ラベルにステータスコードを割り当てる
- `fn` 内で `matchBehavior` を使い、子 Effect の結果を exhaustive に処理する（[contract fn ルール](../rule/contract-fn-rule.md)）
- API 層の `input` / `output` は DB 層とは独立したスキーマ。DB 層のドメインモデルをそのまま使わない

**認証が必要な場合:**

```typescript
import { requiredContext } from "@/effect"
import type { AuthContext } from "../auth/AuthContext"

export const getTodoById = defineEffect(
  {
    service: { findTodoById },
    context: requiredContext<{ auth: AuthContext }>(),
  },
  (service) => (context) =>
    defineRouteContract({ ... }),
)
```

**パスパラメータやクエリを使う場合:**

```typescript
import { routeInput } from "../routeInput"

defineRouteContract({
  input: routeInput({
    params: object({ id: pipe(string(), uuid()) }),
  }),
  // ...
})
```

### 2-2. API 層テスト

`src/api/todo/postTodo.test.ts` を作成する。API 層は `mockBehavior` / `mockService` で DB 層をモック化してテスト。

```typescript
import { constant } from "fast-check"
import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/db"
import { Todo, createTodo } from "@/db/todo"
import { mockBehavior, mockService, testBehavior, propertyCheck } from "@/testing"
import { postTodo } from "./postTodo"

const dummyCtx = {} as DbContext

describe("postTodo", () => {
  const createTodoMock = mockBehavior(createTodo, {
    "TODOを新規作成": async (input) => ({
      ok: true,
      value: parse(Todo, { id: "00000000-0000-0000-0000-000000000001", title: input.title }),
    }),
    "入力値が不正": async () => ({
      ok: false,
      reason: "validation_failed",
      fields: {},
    }),
  })

  testBehavior(postTodo, {
    "作成成功": async (assert) => {
      const service = mockService(postTodo, {
        createTodo: createTodoMock["TODOを新規作成"],
      })
      const result = await postTodo(service)({ db: dummyCtx })({
        title: "買い物",
      })
      const ok = assert(result)
      expect(ok.value.title).toBe("買い物")
    },
    "入力値が不正": propertyCheck(
      postTodo,
      {
        "titleが空": { title: constant("") },
      },
      async (assert, input) => {
        const service = mockService(postTodo, {
          createTodo: createTodoMock["入力値が不正"],
        })
        const result = await postTodo(service)({ db: dummyCtx })(input)
        assert(result)
      },
    ),
  })
})
```

**DB 層テストとの違い:**

|             | DB 層テスト              | API 層テスト                           |
| ----------- | ------------------------ | -------------------------------------- |
| DB 接続     | PGlite（実 DB）          | モック（`dummyCtx`）                   |
| 依存 Effect | なし                     | `mockBehavior` + `mockService`         |
| 呼び出し    | `fn({ db: ctx })(input)` | `fn(service)({ db: dummyCtx })(input)` |

### 2-3. ルート集約

`src/api/todo/todoRoutes.ts` を作成する。ドメイン内の全ルートを1ファイルに集約する。

```typescript
import { Hono } from "hono"
import { createTodo } from "@/db/todo"
import { globalDbContext } from "@/db"
import { defineRoute } from "../defineRoute"
import { postTodo } from "./postTodo"

export const todoRoutes = new Hono()

todoRoutes.post(
  "/",
  ...defineRoute({
    effect: postTodo,
    provide: () => ({
      service: { createTodo },
      context: { db: globalDbContext },
    }),
    description: "TODO を新規作成する",
  }),
)
```

**ポイント:**

- `provide` の `service` にはハンドラの `defineEffect` で宣言したものと同じ Effect を渡す。ハンドラ側が依存の「宣言」、ルート定義側が実体の「注入」
- `provide` の `service` / `context` が不足していればコンパイルエラーになる
- ミドルウェアが必要な場合は `middleware: [authMiddleware] as const` を追加し、`provide` の引数 `c` から `getAuthContext(c)` 等を取得する

**参照:** [API エンドポイントルール](../rule/api-endpoint.md)

### 2-4. barrel export

`src/api/todo/index.ts` を作成する。

```typescript
/**
 * @packageDocumentation
 * ## todo API サブモジュール
 *
 * TODO 管理の API ハンドラとルート定義を提供する。
 * ハンドラロジック（RouteEffect）はモジュール内部でのみ使用し、外部にはエクスポートしない。
 *
 * ### エクスポート
 * - `todoRoutes` — TODO API のルートをまとめた Hono インスタンス
 */

export { todoRoutes } from "./todoRoutes"
```

- ハンドラ（`postTodo` 等）は公開しない。外部には `todoRoutes` のみ

### 2-5. メインアプリにマウント

`src/index.ts` にドメイン単位でマウントする。

```typescript
import { todoRoutes } from "./api/todo"

app.route("/todos", todoRoutes)
```

最後に `npx vp check --fix` と `npx vp test` を実行して全体が正常に動作することを確認する。

---

## チェックリスト

新規ドメイン追加時の最終確認。以下の項目は lint や型チェックでは検出されないため、目視で確認する。

- [ ] テーブル名は単数形
- [ ] DB クエリは `pgExecute` でラップされている（素の try-catch ではなく）
- [ ] DB 層テストは実 DB（PGlite）で動作する（モックではなく）
- [ ] API 層テストは `mockBehavior` / `mockService` でモック化されている（実 DB ではなく）
- [ ] `mockBehavior` の成功値は `parse(DomainModel, ...)` で Branded Type にしている
- [ ] `index.ts` に JSDoc でモジュール説明が記述されている

以下は `npx vp check --fix` と `npx vp test` で自動検証される。

- `okAs` / `failAs` のラベル付与、`onInputError` の宣言、`responses` の網羅、`matchBehavior` の exhaustive 処理、`testBehavior` の全パス網羅 → 型チェックで強制
- barrel export のアクセス制御 → `module-boundary` lint ルールで強制
