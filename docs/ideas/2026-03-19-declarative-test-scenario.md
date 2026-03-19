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

## 背景

Desc ラベルによるテスト網羅の強制（実装済み）の延長として、テストの「入力側」（モック構成）も型で制約する方向。現状はテスト本文内で `getUserById(dummyCtx, { findUserById: ... })` と手続き的に書いており、間違ったモックを渡してもコンパイルは通る。`env` がない関数（DB 層）では `env` プロパティを省略可能にすることで全層で統一的に使える構造になるが、モック構成の検証は `env` がある場合にのみ効く。
