# Effect 型による TDD スタブの整合性検証

## 概要

defineEffect の型情報（Service, Context）を活用し、TDD のスタブ作成段階で層間のインターフェース整合性を実装前に検証する。既存の Behavior（okAs/failAs）による振る舞いパスの検証に加え、context 要求の伝播と service 依存の完全性が型レベルで保証される。

## 検証できること

### 1. スタブ変更時の context 波及検出

下位層のスタブが新しい context を要求すると、上位層の context 型が自動で変わり、provide の過不足がコンパイルエラーとして検出される。

```typescript
// DB 層スタブ: context を追加
const createUser = defineEffect(
  { context: { dbWrite: WritableDb, audit: AuditLog } },
  //                                 ^^^^^^^^^^^^^^^^ 追加
  (context) => defineContract({
    fn: async (input) => {
      if (TODO) return failAs("メールアドレスが重複", "duplicate_entry", { field: "email" })
      return okAs("ユーザーを新規作成", { value: ... })
    }
  })
)

// API 層スタブ: context が自動で { dbWrite, audit } に広がる
const postUser = defineEffect(
  { service: { createUser } },
  (service) => (context) => ...
  // context: { dbWrite: WritableDb, audit: AuditLog }（自動導出）
)

// defineRoute の provide で audit が足りない → コンパイルエラー
// → スタブの段階で provide の修正が必要と分かる
```

### 2. service 依存の追加漏れ検出

下位層のスタブが新しい service 依存を追加すると、FlattenService に自動追加され、provide で不足がコンパイルエラーになる。

```typescript
// createUser が新たに validateEmail に依存
const createUser = defineEffect(
  { service: { validateEmail }, context: { dbWrite: WritableDb } },
  (service) => (context) => ...
)

// postUser の FlattenService に validateEmail が自動追加
// → provide で validateEmail が足りない → コンパイルエラー
// → validateEmail のスタブも必要だと実装前に分かる
```

### 3. スタブ結合時の Behavior + Effect 同時検証

```typescript
const postUser = defineEffect(
  { service: { createUser } },
  (service) => (context) =>
    defineRouteContract({
      fn: async (input) => {
        return matchBehavior(await service.createUser(context)(input), {
          success: ...,        // ← Behavior パスの網羅（既存）
          duplicate_entry: ..., // ← 漏れはコンパイルエラー（既存）
        })
      }
    })
)
// + context の整合性（Effect で追加）
// + service グラフの完全性（Effect で追加）
```

## 検証軸の比較

| 検証軸                 | 既存（Behavior のみ） | Effect 追加後                     |
| ---------------------- | --------------------- | --------------------------------- |
| 振る舞いパスの網羅     | matchBehavior で強制  | 同じ                              |
| context 要求の伝播     | 手動で確認            | 自動導出 → コンパイルエラー       |
| service 依存の追加漏れ | 手動で確認            | FlattenService → コンパイルエラー |
| provide の過不足       | 実行時に発覚          | 型で検出                          |

## TDD フローへの影響

スタブ作成 → 結合 → provide という TDD フローの各段階で、実装前に整合性が型レベルで検証される：

1. **スタブ作成**: 各 Effect のスタブを書く（context と Behavior パスを宣言）
2. **結合**: 上位スタブが下位スタブを service に宣言し、matchBehavior で結合 → Behavior の整合性 + context の伝播が検証される
3. **provide**: defineRoute で全依存を provide → service グラフの完全性と context の過不足が検証される
4. **テスト → 実装**: すべての型が通った状態で実装に入れる

## 前提条件

- [defineEffect アイディア](2026-03-20-define-effect.md) が実装されていること
- [behavior-driven TDD](2026-03-19-behavior-driven-tdd.md) のスタブ先行フローとの組み合わせ

## 背景

defineEffect の設計議論で、Effect の型パラメータ（Service, Context）がスタブの段階から型レベルで伝播することに気づいた。既存の Behavior 検証が「振る舞いパスの整合性」を保証するのに対し、Effect は「依存とリソースの整合性」を保証する。両者を組み合わせることで、TDD のスタブ段階で検証できる範囲が大きく広がる。
