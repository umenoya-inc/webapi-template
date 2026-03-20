# Effect System の lint ルール

## 概要

defineEffect で導入される Effect ブランドを手がかりに、lint ルールで副作用の使用を静的に制約する。Effect を通さない副作用の実行を構造的に不可能にすることが目的。

## ルール

### 1. Effect は Effect 内からしか呼べない

Effect ブランドを持つ関数の呼び出しを、以下の場所に限定する：

- **defineEffect の fn 内**（service 経由）
- **defineRoute の provide**（唯一の provide ポイント）
- **テストコード**（testBehavior, mockBehavior 等）

```typescript
// NG: 素の関数から Effect を直接呼ぶ
const handler = async () => {
  const result = await createUser(service)(context)(input) // lint error
}

// OK: Effect 内から service 経由で呼ぶ
const postUser = defineEffect(
  { service: { createUser } },
  (service) => (context) =>
    defineRouteContract({
      fn: async (input) => {
        await service.createUser(context)(input) // OK
      },
    }),
)
```

### 2. Effect 内での context 直接 import 禁止

defineEffect の fn 内で、context に相当するリソース（globalDbContext 等）を直接 import して使うことを禁止する。context は必ず引数から受け取る。

```typescript
// NG: Effect 内で globalDbContext を直接 import
import { globalDbContext } from "@/db"

const createUser = defineEffect({ context: { db: DbContext } }, (context) => {
  const db = globalDbContext // lint error
})

// OK: context 引数から受け取る
const createUser = defineEffect({ context: { db: DbContext } }, (context) => {
  const db = context.db // OK
})
```

### 3. service に宣言されていない Effect の使用禁止

defineEffect の fn 内で Effect ブランドを持つ関数を使用する場合、service に宣言されていなければエラーにする。

```typescript
// NG: service に宣言せず直接 import
import { findUserById } from "@/db/user"

const createUser = defineEffect(
  { service: {} },
  (service) => (context) => {
    findUserById(...)  // lint error: service に宣言されていない Effect
  }
)

// OK: service に宣言してから使う
const createUser = defineEffect(
  { service: { findUserById } },
  (service) => (context) => {
    service.findUserById(context)(...)  // OK
  }
)
```

## 効果

3つのルールが揃うことで：

- **Effect のバイパス防止**: 副作用は必ず Effect System を通して実行される
- **依存グラフの完全性**: すべての依存が service に宣言され、型レベルで追跡可能
- **context の provide 保証**: リソースは必ず provide 経由で渡され、テスト時の差し替えが確実に機能する

## 実装方針

- Effect ブランド（`effectBrand` シンボル）を持つ型の検出には、既存の `enforce-dependencies` ルールと同様に TypeScript の型情報を利用する
- defineEffect / defineRoute / テストコード等の許可された呼び出し元はルール設定で指定

## 前提条件

- [defineEffect アイディア](2026-03-20-define-effect.md) が実装されていること
- Effect ブランドが型レベルで検出可能であること

## 背景

defineEffect の設計議論で、型による制約だけでなく lint による静的解析を組み合わせることで、Effect System のバイパスを構造的に防げることに気づいた。既存の `enforce-dependencies` ルールの発展形として位置づけられる。
