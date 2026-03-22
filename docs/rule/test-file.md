# テストファイル

## テストの配置

テストファイルはテスト対象と同じディレクトリに `*.test.ts` として配置する。

```
src/modules/db/user/
├── createUser.ts          # テスト対象
├── createUser.test.ts     # テストファイル
```

## テストユーティリティ

テスト専用のユーティリティは `*.testutil.ts` として定義する。`*.testutil.ts` は `*.test.ts` または他の `*.testutil.ts` からのみインポートできる。通常のコードからインポートすると lint エラーになる。

テストユーティリティの整理が必要な場合は `testing/` サブモジュールに配置する。

```
src/modules/db/
├── testing/
│   └── createTestDbContext.testutil.ts   # DB テスト用ヘルパー
├── user/
│   ├── createUser.ts
│   └── createUser.test.ts
```

## testBehavior による振る舞い別テスト

`defineContract` ベースの関数は `testBehavior` を使ってテストする。テストケースのキーは実装の Desc ラベルから導出され、全ラベルの網羅が型レベルで強制される。

### DB 層のテスト

DB 層の関数（leaf effect）は、PGlite を使った実 DB テスト。テストデータの準備・確認には `rawDb` を使い、テスト対象の関数は `DbContext` 経由で呼び出す。

`rawDb` は `DbClient` を経由せず生の Drizzle クライアントを返すテスト専用ユーティリティ。テストデータのセットアップは本番コードの安全装置（`execute` / `query` の使い分け）が不要なため、直接操作する。`rawDb` は `.testutil.ts` に配置されており、`test-boundary/no-testutil-in-production` で本番コードからの使用は禁止されている。また `db/testing/` は barrel export を持たないため、`api/` からのアクセスは `module-boundary/no-module-internal-import` でブロックされる。

```typescript
import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { rawDb } from "../testing/rawDb.testutil"
import { testBehavior } from "@/testing"
import { findUserById } from "./findUserById"
import { userTable } from "./userTable"

const insertUserRow = (ctx: DbContext, values: { name: string; email: string }) =>
  rawDb(ctx).insert(userTable).values(values).returning()

describe("findUserById", () => {
  let ctx: DbContext
  let cleanup: () => Promise<void>

  beforeAll(async () => {
    const result = await createTestDbContext({ userTable })
    ctx = result.ctx
    cleanup = result.cleanup
  }, 30000)

  afterAll(async () => {
    await cleanup?.()
  })

  // キーは実装の okAs / failAs ラベルから導出される
  // ラベルが不足するとコンパイルエラー
  testBehavior(findUserById, {
    "IDに該当するユーザーを取得": async (assert) => {
      const [inserted] = await insertUserRow(ctx, { name: "Alice", email: "alice@example.com" })
      const result = await findUserById({ db: ctx })({ id: inserted.id })
      const user = assert(result) // 型が該当 variant に絞り込まれる
      expect(user.value.id).toBe(inserted.id)
      expect(user.value.name).toBe("Alice")
    },
    "IDに該当するユーザーが存在しない": async (assert) => {
      const result = await findUserById({ db: ctx })({ id: "00000000-0000-0000-0000-000000000000" })
      assert(result)
    },
    "入力値が不正": async (assert) => {
      const result = await findUserById({ db: ctx })({ id: "not-a-uuid" })
      assert(result)
    },
  })
})
```

### Domain 層のテスト（mockBehavior + mockEnv）

Domain 層の関数（env を持つ）は、依存を `mockBehavior` でモック化し、`mockEnv` で型安全に env を構築してテストする。`mockBehavior` は `describe` 内に配置する。

```typescript
import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/modules/db"
import { User, findUserById } from "@/modules/db/user"
import { mockEnv, mockBehavior, testBehavior } from "@/modules/testing"
import { getUserById } from "./getUserById"

const dummyCtx = {} as DbContext
const dummyUserId = "00000000-0000-0000-0000-000000000001"

describe("getUserById", () => {
  // mockBehavior: 全 Desc ラベルに対応するモック実装を定義（網羅必須）
  const findUserByIdMock = mockBehavior(findUserById, {
    "IDに該当するユーザーを取得": async (input) => ({
      ok: true,
      value: parse(User, { id: input.id, name: "Alice", email: "alice@example.com" }),
    }),
    "IDに該当するユーザーが存在しない": async () => ({
      ok: false,
      reason: "not_found",
    }),
    "入力値が不正": async () => ({
      ok: false,
      reason: "validation_failed",
      fields: {},
    }),
  })

  testBehavior(getUserById, {
    "IDに該当するユーザーを取得": async (assert) => {
      // mockEnv: Contract 関数の末尾引数型と一致するか検証される
      const env = mockEnv(getUserById, {
        findUserById: findUserByIdMock["IDに該当するユーザーを取得"],
      })
      const result = await getUserById(dummyCtx, env)({ id: dummyUserId })
      const user = assert(result)
      expect(user.value.id).toBe(dummyUserId)
      expect(user.value.name).toBe("Alice")
    },
    "IDに該当するユーザーが存在しない": async (assert) => {
      const env = mockEnv(getUserById, {
        findUserById: findUserByIdMock["IDに該当するユーザーが存在しない"],
      })
      const result = await getUserById(dummyCtx, env)({ id: dummyUserId })
      assert(result)
    },
    "入力値が不正": async (assert) => {
      const env = mockEnv(getUserById, {
        findUserById: findUserByIdMock["IDに該当するユーザーを取得"],
      })
      const result = await getUserById(dummyCtx, env)({ id: "not-a-uuid" })
      assert(result)
    },
  })
})
```

### 名前付き複数テスト

1つの Desc ラベルに対して複数のテストケースがある場合は、オブジェクトで名前を付ける。

```typescript
testBehavior(listUsers, {
  "ユーザーが存在しない": async (assert) => {
    const result = await listUsers(ctx)()
    const ok = assert(result)
    expect(ok.value).toEqual([])
  },
  "登録済みユーザー一覧を取得": {
    "2件のユーザーを返す": async (assert) => { ... },
    "名前順にソートされている": async (assert) => { ... },
  },
})
```

### parameterize（パラメタライズドテスト）

同じ振る舞いパスに対して複数の入力パターンをテストする場合は `parameterize` を使う。各エントリが個別テストとして実行される。

実装側で `InputScenarios`（`failAs` / `okAs` の最終引数に文字列配列）を宣言している場合、params のキーはそのシナリオラベルと一致する必要がある。宣言がない場合はキーは自由。

```typescript
import { parameterize, testBehavior } from "@/testing"

testBehavior(createUser, {
  // ...
  "入力値が不正": parameterize(
    {
      "nameが空": { name: "", email: "valid@example.com" },
      "emailが不正": { name: "Alice", email: "invalid" },
      "name文字数超過": { name: "A".repeat(101), email: "alice@example.com" },
    },
    async (assert, input) => {
      const result = await createUser(ctx)(input)
      assert(result)
    },
  ),
})
```

### propertyCheck（プロパティベーステスト）

スキーマから入力を自動生成してプロパティベーステストを行う場合は `propertyCheck` を使う。params の値は fast-check の arbitrary によるフィールド単位のオーバーライド。指定しないフィールドは Valibot スキーマから自動生成される。

```typescript
import { constant, string } from "fast-check"
import { propertyCheck, testBehavior } from "@/testing"

testBehavior(createUser, {
  // ...
  "入力値が不正": propertyCheck(
    createUser,
    {
      "nameが空": { name: constant("") },
      "emailが不正": { email: string() },
      "name文字数超過": { name: string({ minLength: 101 }) },
    },
    async (assert, input) => {
      const result = await createUser(ctx)(input)
      assert(result)
    },
  ),
})
```

### defaultInputError（入力シナリオ付きデフォルトエラー）

`defineContract` の `onInputError` にシナリオラベルを宣言する場合は `defaultInputError` を使う。デフォルトのバリデーションエラー応答にシナリオラベルが付与され、`parameterize` / `propertyCheck` のキーとして型レベルで強制される。

```typescript
import { defaultInputError, defineContract, failAs, okAs } from "@/contract"

export const createUser = (ctx: DbContext) =>
  defineContract({
    input: object({ ... }),
    output: User,
    onInputError: defaultInputError(["nameが空", "emailが不正", "name文字数超過"]),
    fn: async (input) => { ... },
  })
```
