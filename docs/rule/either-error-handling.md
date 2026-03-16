# Discriminated Unionによるエラーハンドリング

正常系のエラーハンドリングは、例外（throw）を使わず Discriminated Union（判別可能なユニオン型）で行う。

## 目的

エラーの発生箇所と処理箇所を型レベルで明示し、エラーの見落としを防ぐ。例外はコードの流れを追いにくくし、どの関数がどのエラーを投げるか型情報から判別できない。Discriminated Union を使うことで、呼び出し側は判別子（`ok` プロパティ等）による分岐を強制され、エラーケースの処理漏れをコンパイル時に検出できる。

## 例

```typescript
// ✅ Discriminated Union で結果を返す
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const findUser = (id: string): Result<User, "not_found"> => {
  const user = userStore.get(id);
  if (!user) return { ok: false, error: "not_found" };
  return { ok: true, value: user };
};

// 呼び出し側は分岐が強制される
const result = findUser(id);
if (!result.ok) {
  // result.error の型は "not_found"
  return c.json({ error: result.error }, 404);
}
// result.value の型は User
return c.json(result.value);

// ❌ 例外を使う
const findUser = (id: string): User => {
  const user = userStore.get(id);
  if (!user) throw new HTTPException(404, { message: "User not found" });
  return user;
};
```

## 例外を使ってよいケース

- 予期しないプログラムエラー（バグ）
- フレームワーク側が例外を要求する場合
