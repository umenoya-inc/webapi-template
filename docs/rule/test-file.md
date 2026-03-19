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

## testContract による振る舞い別テスト

`defineContract` ベースの関数は `testContract` を使ってテストする。テストケースのキーは実装の Desc ラベルから導出され、全ラベルの網羅が型レベルで強制される。

### DB 層のテスト

DB 層の関数（env を持たない）は、実際の DB に接続してテストする。

```typescript
import { afterAll, beforeAll, describe, expect } from "vite-plus/test"
import type { DbContext } from "../DbContext"
import { fromDbContext } from "../fromDbContext"
import { createTestDbContext } from "../testing/createTestDbContext.testutil"
import { testContract } from "@/modules/testing"
import { findUserById } from "./findUserById"
import { userTable } from "./userTable"

const insertUserRow = (ctx: DbContext, values: { name: string; email: string }) => {
  const db = fromDbContext(ctx)
  return db.insert(userTable).values(values).returning()
}

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
  testContract(findUserById, {
    "IDに該当するユーザーを取得": async (assert) => {
      const [inserted] = await insertUserRow(ctx, { name: "Alice", email: "alice@example.com" })
      const result = await findUserById(ctx)({ id: inserted.id })
      const user = assert(result) // 型が該当 variant に絞り込まれる
      expect(user.value.id).toBe(inserted.id)
      expect(user.value.name).toBe("Alice")
    },
    "IDに該当するユーザーが存在しない": async (assert) => {
      const result = await findUserById(ctx)({ id: "00000000-0000-0000-0000-000000000000" })
      assert(result)
    },
    "入力値が不正": async (assert) => {
      const result = await findUserById(ctx)({ id: "not-a-uuid" })
      assert(result)
    },
  })
})
```

### Domain 層のテスト（mockContract + mockEnv）

Domain 層の関数（env を持つ）は、依存を `mockContract` でモック化し、`mockEnv` で型安全に env を構築してテストする。`mockContract` は `describe` 内に配置する。

```typescript
import { parse } from "valibot"
import { describe, expect } from "vite-plus/test"
import type { DbContext } from "@/modules/db"
import { User, findUserById } from "@/modules/db/user"
import { mockEnv, mockContract, testContract } from "@/modules/testing"
import { getUserById } from "./getUserById"

const dummyCtx = {} as DbContext
const dummyUserId = "00000000-0000-0000-0000-000000000001"

describe("getUserById", () => {
  // mockContract: 全 Desc ラベルに対応するモック実装を定義（網羅必須）
  const findUserByIdMock = mockContract(findUserById, {
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

  testContract(getUserById, {
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
testContract(listUsers, {
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

## テスト変更時の JSDoc 更新

テストファイルを新規作成または更新した場合は、`/test-to-doc` スキルで対応するソースファイルの JSDoc を再生成する。
