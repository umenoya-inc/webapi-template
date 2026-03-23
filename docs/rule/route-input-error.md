<!-- specdrift v1 -->

# 入力バリデーションシナリオの宣言

<!-- source: src/contract/defaultInputError.ts@0974d158 -->

## ルール

`defineContract` / `defineRouteContract` で `input` を指定する場合、`onInputError` は必須。`defaultInputError([...])` で具体的なバリデーションシナリオを列挙する。入力がない場合は `input` を省略する。

## 目的

- `propertyCheck` でシナリオごとのテストを書けるようにする
- どのような入力が不正になるかをコード上で明示する
- 入力がないエンドポイントでは不要な `"入力値が不正"` を型レベルで除外する

## パターン

### 入力がある場合（onInputError 必須）

```typescript
// ✅ input がある → onInputError でシナリオを列挙（必須）
defineContract({
  input: object({ id: pipe(string(), uuid()) }),
  output: User,
  onInputError: defaultInputError(["IDが不正"]),
  fn: async (input) => { ... },
})

defineRouteContract({
  input: routeInput({
    params: object({ id: pipe(string(), uuid()) }),
  }),
  output: object({ ... }),
  onInputError: defaultInputError(["IDが不正"]),
  responses: {
    "取得成功": { status: 200 },
    "入力値が不正": { status: 400 },
  },
  fn: async (input) => { ... },
})
```

```typescript
// ❌ input があるのに onInputError がない → 型エラー
defineContract({
  input: object({ id: pipe(string(), uuid()) }),
  output: User,
  fn: async (input) => { ... },
})
```

### 入力がない場合（input 省略）

```typescript
// ✅ input 省略 — "入力値が不正" は不要
defineContract({
  output: array(User),
  fn: async () => { ... },
})

defineRouteContract({
  output: array(object({ ... })),
  responses: {
    "一覧取得成功": { status: 200 },
  },
  fn: async () => { ... },
})
```

<!-- /source -->

## Lint

型チェックで強制。`input` がある場合に `onInputError` がないとコンパイルエラーになる。
