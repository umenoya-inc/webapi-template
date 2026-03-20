# DbContext の Read / Write 分離

## 概要

現在単一の `DbContext` を defineEffect の context として `{ db: DbContext }` の形で使っているが、これを `{ dbRead: ReadonlyDb }` と `{ dbWrite: WritableDb }` に細分化する。Effect の context 自動導出により、各関数が「読むだけか、書くのか」が型から見えるようになる。

## コード例

```typescript
// 読むだけの関数
const findUserById = defineEffect(
  { context: { dbRead: ReadonlyDb } },
  (context) => defineContract({ ... })
)

// 書く関数（読みも必要なら service 経由で伝播）
const createUser = defineEffect(
  { service: { findUserById }, context: { dbWrite: WritableDb } },
  (service) => (context) => ...
  // context: { dbRead: ReadonlyDb, dbWrite: WritableDb }
  //           ^^^^^^^^^^^^^^^^^^^^^^ findUserById から自動伝播
)
```

## 応用候補

- **Read Replica 構成**: provide で dbRead と dbWrite に別のコネクションを渡すだけ。Effect 側のコードは変わらない
- **権限の型レベル制約**: 参照系 API が誤って書き込み用 context を要求していたらコンパイルで気づける
- **transaction の対象明確化**: dbWrite だけ transaction に含め、dbRead は transaction 外で実行する等の制御が可能

## 前提条件

- defineEffect の context が Record 型で intersection によりマージされる設計（[defineEffect アイディア](2026-03-20-define-effect.md)）
- ReadonlyDb / WritableDb の具体的な型設計（Drizzle ORM の API でどう分けるか）は要検討

## 背景

defineEffect の設計議論で context の能力分離が自然に表現できることに気づいた。単一の DbContext では「この関数は DB に何をするか」が型に現れないが、Read / Write を分けることで CQRS 的な分離が型レベルで強制される。
