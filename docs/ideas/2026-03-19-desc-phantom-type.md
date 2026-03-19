# Desc phantom type による discriminated union への説明埋め込み

## 概要

Discriminated union の各 variant に phantom property で説明文を埋め込む。型の構造的互換性を保ちつつ、IDE ホバーやツールから説明を取り出せるようにする。

## コードイメージ

```typescript
type Desc<Label extends string, T> = T & { readonly __desc?: Label }

function failAs<D extends string, R extends string>(
  _desc: D,
  reason: R,
): Desc<D, { ok: false; reason: R }> {
  return { ok: false, reason } as any
}

// 使用例
return failAs("DBにユーザーが存在しない", "not_found")

// 型に説明が現れる:
// Desc<"DBにユーザーが存在しない", { ok: false; reason: "not_found" }>
```

## 説明の抽出

```typescript
type ExtractDesc<T> = T extends { __desc?: infer D extends string } ? D : never

type Errors = ExtractDesc<Awaited<ReturnType<ReturnType<typeof findUserById>>>>
// = "DBにユーザーが存在しない" | "入力値が不正"
```

## 利点

- **導入コストが低い** — `as const` の return を `failAs(...)` に置き換えるだけ
- **Generator 不要** — 既存の defineContract にそのまま載せられる
- **汎用的** — defineContract に限らず、discriminated union を返すすべての関数に適用可能
- **ツール連携** — `ExtractDesc` でドキュメント生成、テスト生成の入力に使える
- **コーディングエージェント支援** — 型シグネチャだけでエラーの意味がわかり、実装を辿る必要が減る

## 課題

- union が大きくなったときのホバー表示の冗長さ
- `__desc` というプロパティ名の命名規約
- failAs の引数に渡す説明文の粒度・表現の統一ルール
