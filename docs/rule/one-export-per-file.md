# 1ファイル1エクスポート

1ファイルからexportするものは1定義に制限し、exportされるシンボル名と同じファイル名にする。

## 目的

シンボル名からファイルを即座に特定できるようにし、コードの検索性と一貫性を担保する。

## 例

```typescript
// ✅ routes/healthRoute.ts
export const healthRoute = new Hono()

// ❌ routes/health.ts（ファイル名とシンボル名が不一致）
export const healthRoute = new Hono()

// ❌ 1ファイルに複数export
export const healthRoute = new Hono()
export const statusRoute = new Hono()
```

## 同名の値と型のペア

同名の値エクスポートと型エクスポートは1つのエクスポートとみなす。Valibot スキーマとその推論型のように、値と型が一体で使われるパターンに対応する。

```typescript
// ✅ User.ts — 同名の値と型は1つのエクスポート扱い
export const User = pipe(object({ name: string() }), brand("User"))
export type User = InferOutput<typeof User>
```

## 除外

- `index.ts` は barrel export 用のファイルとして使用するため、このルールの対象外とする。
