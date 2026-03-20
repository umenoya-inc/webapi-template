# 名前のある型は直接書く

## ルール

`Parameters<typeof fn>[0]` や `ReturnType<typeof fn>` のようなユーティリティ型による間接導出は、その型に名前がある（直接 import できる）場合は使わない。

## 目的

- **可読性:** 型名が直接書かれていれば、シグネチャを見るだけで何を受け取るかわかる
- **不要な結合の回避:** 関数の引数順序や戻り値の構造変更が、無関係な箇所に波及しない

## 例

```typescript
// ✅ 名前のある型を直接書く
import { DbContext } from "@/db"

export const postUser = (ctx: DbContext, env = { createUser }) =>
  defineRouteContract({ ... })
```

```typescript
// ❌ 名前のある型をユーティリティ型で間接導出している
import { createUser } from "@/db/user"

export const postUser = (
  ctx: Parameters<typeof createUser>[0],
  env = { createUser },
) =>
  defineRouteContract({ ... })
```

## 例外

型に名前がない場合（モジュール外に export されていない内部型、無名のオブジェクト型など）はユーティリティ型の使用を許容する。
