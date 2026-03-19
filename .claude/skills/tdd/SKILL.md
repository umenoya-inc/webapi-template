---
name: tdd
description: Behavior-driven TDD で DB から API まで一気通貫で実装する
---

## 概要

`$ARGUMENTS` に実装したい機能の説明を受け取り、Behavior-driven TDD のフローで DB 層から API 層までを段階的に実装する。

各ステップでユーザーの確認を取りながら進める。**勝手に次のステップに進まないこと。**

## フロー

### Step 1: 仕様の整理

`$ARGUMENTS` から以下を整理してユーザーに提示する。コードは書かない。

- 必要な DB 操作（テーブル、CRUD）
- API エンドポイント（メソッド、パス、リクエスト/レスポンス）
- 各層の振る舞いパス（成功/失敗の分岐とラベル案）

ユーザーの合意を得てから次に進む。

### Step 2: スタブ実装（DB → API を一気通貫）

全層のスタブ実装を一気に作成する。スタブ実装とは「型が通り、層間の接続が検証できる仮実装」。

#### 2-1. DB 層

- テーブル定義（`*Table.ts`）がなければ作成
- ドメインモデル（`*.ts` + Branded Type）がなければ作成
- 操作関数を `defineContract` で作成。`fn` には仮の実装を入れる:

```typescript
fn: async (input) => {
  // 仮実装: 常に成功を返す
  return okAs("ユーザーを新規作成", {
    value: { id: "00000000-0000-0000-0000-000000000000", name: input.name, email: input.email },
  })
}
```

- すべてのパス（failAs 含む）に到達できる仮実装にする。`declare const TODO: boolean` パターンを使う:

```typescript
declare const TODO: boolean
fn: async (input) => {
  if (TODO)
    return failAs("メールアドレスが既存ユーザーと重複", "duplicate_entry", { field: "email" })
  return okAs("ユーザーを新規作成", {
    value: { id: "00000000-0000-0000-0000-000000000000", name: input.name, email: input.email },
  })
}
```

- `index.ts` の barrel export に追加

#### 2-2. API 層

- [API エンドポイントルール](docs/rule/api-endpoint.md) に従いファイルを配置
- ハンドラを `defineRouteContract` で作成。DB 操作を `env` で注入し、`fn` 内で実際に呼び出す（スタブ同士を接続）
- `responses` マップでステータスコードを宣言
- ルート定義ファイル（`defineRoute`）を作成
- `src/index.ts` にルートを登録

#### 2-3. 型チェック

```bash
npx vp check --fix
```

型チェックが通ることで以下が検証される:

- DB 層の okAs/failAs ラベルが正しい型を持つ
- API 層の fn が DB 層の結果を正しく分岐している
- responses マップが全ラベルを網羅している
- 層間のスキーマが整合している

**型チェックが通るまで修正する。** ユーザーにスタブ実装の全体像を確認してもらう。

### Step 3: テスト作成

DB 層と API 層のテストを作成する。

#### DB 層テスト

- `testBehavior` で全ラベルを網羅
- PGlite を使った実 DB テスト
- 入力バリデーションは `parameterize` または `propertyCheck` で

#### API 層テスト

- `testBehavior` で全ラベルを網羅
- DB 操作は `mockBehavior` + `mockEnv` でモック
- 入力バリデーションは `propertyCheck` で

テスト実行:

```bash
npx vp test run src/db/<domain>/ src/api/<domain>/
```

DB 層はスタブ実装なのでテストは失敗する。失敗を確認してユーザーに報告する。

### Step 4: 本実装

DB 操作関数の `fn` を本実装に置き換える。

- `declare const TODO: boolean` と TODO 分岐を削除
- 実際の DB クエリを記述
- [DB エラーハンドリングルール](docs/rule/db-error-handling.md) に従う
- API 層は通常変更不要（Step 2 で DB 呼び出しを接続済み）

テスト実行:

```bash
npx vp test run src/db/<domain>/ src/api/<domain>/
```

全テストが通ることを確認。

### Step 5: 最終確認

```bash
npx vp check --fix
npx vp test
```

全体の型チェックとテストが通ることを確認し、結果をユーザーに報告する。

## 注意事項

- 各ステップの完了時にユーザーの確認を取る
- スタブ実装段階で `npx vp check --fix` が通ることを必ず確認する（型が層間の整合性を検証する）
- CLAUDE.md のルールを遵守する
