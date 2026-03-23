# 型によるテスト網羅の強制

<!-- specdrift v1 -->

実装の各コードパスに Desc ラベルを付与し、`testBehavior` がそのラベル集合を exhaustive なキーとして要求することで、テストケースの網羅をコンパイル時に強制する。

<!-- source: src/behavior/okAs.ts@862da67e, src/behavior/failAs.ts@77007a47, src/testing/testBehavior.testutil.ts@9ddce2c7 -->

## 原則

- `defineContract` の `fn` 内で `okAs` / `failAs` を使い、各コードパスに説明ラベルを付与する
- ラベルは「呼び出し側にとって意味のある振る舞いの違い」を基準に分ける
- `testBehavior` のキーは Desc ラベルから導出され、全ラベルの網羅が必須
- 実装にコードパスを追加したらテストも書かないとコンパイルが通らない

## 例

### 実装: コードパスにラベルを付ける

```typescript
export const listUsers = (ctx: DbContext) =>
  defineContract({
    output: array(User),
    fn: async () => {
      const db = fromDbContext(ctx)
      const rows = await db.query((q) => q.select().from(userTable))
      if (rows.length === 0) {
        return okAs("ユーザーが存在しない", [])
      }
      return okAs(
        "登録済みユーザー一覧を取得",
        rows.map((row) => ({ id: row.id, name: row.name, email: row.email })),
      )
    },
  })
```

### テスト: 型が全ラベルを要求する

```typescript
// 各ラベルに対応するテストケースがないとコンパイルエラー
testBehavior(listUsers, {
  "ユーザーが存在しない": async (assert) => {
    const result = await listUsers(ctx)()
    const ok = assert(result)
    expect(ok.value).toEqual([])
  },
  "登録済みユーザー一覧を取得": async (assert) => {
    // ...
  },
})
```

### 実装にパスを追加した場合

```typescript
fn: async () => {
  // ... 既存のコード ...
  if (rows.length > 100) {
    return okAs("取得上限を超過", rows.slice(0, 100).map(...))
  }
  // ...
}
```

テストに `"取得上限を超過"` のケースを追加しないとコンパイルエラーになる。

## ラベルの粒度

ラベルを付ける基準は「呼び出し側にとって意味のある振る舞いの違いかどうか」。

```typescript
// ✅ 呼び出し側の判断が変わる分岐
if (rows.length === 0) return okAs("ユーザーが存在しない", [])
return okAs("登録済みユーザー一覧を取得", rows.map(...))

// ❌ 呼び出し側にとって区別する意味がない分岐
if (rows.length === 1) return okAs("検索結果1件", results)
return okAs("検索結果複数件", results)
```

独立条件の組み合わせが多い場合は、個別に分岐せずラベルに条件の詳細を記述してグループ化する。テスト側はラベルから再現条件を読み取れる。

```typescript
return failAs("必須項目が不足（name, email未入力）", "validation_failed", { ... })
return failAs("権限不足かつ管理者承認なし", "forbidden", { ... })
```

## 仕組み

1. `okAs` / `failAs` が `Desc<Label, T>` ブランド型を返す
2. `defineContract` の `fn` 戻り値型制約が `Desc` を要求し、素のオブジェクトリテラルを拒否する
3. 外部戻り値型に各ラベルが `Desc` として保持される（`ReplaceOkValue` で分配）
4. `testBehavior` が `DescLabel<ContractResultUnion<F>>` を exhaustive なキーとして要求する
5. `mockBehavior` も同じキーを使い、モック定義の網羅を強制する

## InputScenarios による入力パターンの網羅

`okAs` / `failAs` の最終引数に文字列配列を渡すと、`InputScenarios` ブランドが `Desc` に付与される。`testBehavior` の `parameterize` / `propertyCheck` で、そのシナリオラベルがパラメータキーとして型レベルで強制される。

```typescript
// 実装側: シナリオを宣言
onInputError: defaultInputError(["nameが空", "emailが不正", "name文字数超過"]),

// テスト側: キーの過不足がコンパイルエラーになる
"入力値が不正": parameterize({
  "nameが空": { ... },       // 必須
  "emailが不正": { ... },    // 必須
  "name文字数超過": { ... }, // 必須
  // "存在しないキー" → コンパイルエラー
}, async (assert, input) => { ... }),
```

シナリオ宣言はオプショナル。宣言がないラベルでは `parameterize` / `propertyCheck` のキーは自由（`string` フォールバック）。

<!-- /source -->

## 既存アプローチとの違い

| アプローチ                     | 検出タイミング   | 検出対象                                 |
| ------------------------------ | ---------------- | ---------------------------------------- |
| コードカバレッジ               | ランタイム       | 実行された行・分岐                       |
| Mutation testing               | ランタイム       | テストが変更を検出するか                 |
| 型付きエラー（Effect, ZIO）    | コンパイル時     | プロダクションコードのエラーハンドリング |
| **Desc ラベル + testBehavior** | **コンパイル時** | **テストケースの振る舞い網羅**           |
