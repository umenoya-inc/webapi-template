# テストシナリオの宣言的定義とモック構成の型検証

## 概要

`testContract` のテストケース定義にモック構成（`env`）を宣言的に含め、テストケースごとにどのモック variant を使うかを型レベルで検証する。テスト本文内で手続き的にモックを組み立てる代わりに、宣言的な構造としてモック構成を可視化する。

## コードイメージ

```typescript
// domain 層: env あり — モック構成を宣言
testContract(getUserById, {
  "IDに該当するユーザーを取得": {
    env: { findUserById: findUserByIdMock["IDに該当するユーザーを取得"] },
    test: async (run, assert) => {
      const result = await run({ id: dummyUserId })
      const user = assert(result)
      expect(user.value.name).toBe("Alice")
    },
  },
  "IDに該当するユーザーが存在しない": {
    env: { findUserById: findUserByIdMock["IDに該当するユーザーが存在しない"] },
    test: async (run, assert) => {
      const result = await run({ id: dummyUserId })
      assert(result)
    },
  },
})

// DB 層: env なし — env を省略、test のみ
testContract(findUserById, {
  "IDに該当するユーザーを取得": {
    test: async (run, assert) => {
      const result = await run({ id: inserted.id })
      const user = assert(result)
      expect(user.value.id).toBe(inserted.id)
    },
  },
})

// 依存が複数ある場合
testContract(createTodo, {
  "担当者が存在しない": {
    env: {
      findUserById: findUserByIdMock["IDに該当するユーザーが存在しない"],
      saveTodo: saveTodoMock["Todoを保存"],
    },
    test: async (run, assert) => { ... },
  },
})
```

## 応用候補

- **モック構成の型検証** — `env` の型が対象関数の第2引数から導出され、必要なモックの過不足がコンパイル時にエラーになる
- **run の自動束縛** — `env` と `ctx` を束縛済みの Contract 呼び出しとして `run` を提供し、テスト本文は入力だけ渡せばよい
- **テスト構造の可視化** — 各テストケースがどのモック構成で実行されるかがコードの構造として見える

## mockContract の vi.fn() 統合

現状の `mockContract` は固定値を返す関数を生成する。これだと呼び出し回数の検証やシーケンシャルな振る舞い（1回目と2回目で異なる結果を返す）に対応できない。

### 方針

- `mockContract` 内部で `vi.fn()` をラップし、返却するモック関数をスパイにする
- 実装変更は `() => value` を `() => vi.fn(value)` にするだけ。型は変わらない
- `mockContract` の呼び出しを `describe` 内に置き、テストスイートごとにスパイをリセットする

### コードイメージ

```typescript
describe("getUserById", () => {
  // describe 内で定義 → テストスイートごとにスパイが新規作成される
  const findUserByIdMock = mockContract(findUserById, {
    "IDに該当するユーザーを取得": async (input) => ({ ... }),
    "IDに該当するユーザーが存在しない": async () => ({ ... }),
    "入力値が不正": async () => ({ ... }),
  })

  testContract(getUserById, {
    "IDに該当するユーザーが存在しない": {
      env: { findUserById: findUserByIdMock["IDに該当するユーザーが存在しない"] },
      test: async (run, assert) => {
        const result = await run({ id: dummyUserId })
        assert(result)
        // vi.fn() なので呼び出し検証もできる
        expect(findUserByIdMock["IDに該当するユーザーが存在しない"]).toHaveBeenCalledOnce()
      },
    },
  })
})
```

### これにより

- **呼び出し回数検証** — `toHaveBeenCalledTimes` が使える
- **シーケンシャル** — `mockResolvedValueOnce` で呼び出しごとに異なる結果を返せる
- **宣言的 env と両立** — `run` を唯一の呼び出し手段にしても vi.fn() の機能は使える
- **リセット** — describe 内定義でテストスイートごとにスパイが新規作成される

## 背景

Desc ラベルによるテスト網羅の強制（実装済み）の延長として、テストの「入力側」（モック構成）も型で制約する方向。現状はテスト本文内で `getUserById(dummyCtx, { findUserById: ... })` と手続き的に書いており、間違ったモックを渡してもコンパイルは通る。`env` がない関数（DB 層）では `env` プロパティを省略可能にすることで全層で統一的に使える構造になるが、モック構成の検証は `env` がある場合にのみ効く。
