# EffectChainError のデバッグ情報拡充

## 概要

EffectChainError に追加できるデバッグ情報の候補と、実現可能性の検討。

## 候補

### context の値に toString() でデバッグ情報を持たせる

context オブジェクト（DbContext 等）に `toString()` を実装し、EffectChainError がそれを拾って表示する案。

- 例: `DbContext(pool=main, schema=public)`, `AuthContext(userId=xxx, role=admin)`
- 課題: 現在の DbContext は Branded Type で Drizzle インスタンスをラップしている。`toString()` を持たせるにはラッパーか Proxy が必要だが、`fromDbContext` との透過性や型互換性が壁になる
- Proxy は TypeScript の型推論・Branded Type と相性が悪い

### リクエストメタデータ

`defineRoute` のハンドラ実行時に HTTP メソッド・パス・リクエスト ID を EffectChainError に付与する。本番ログとの突き合わせに有用。`defineRoute` の try-catch で Hono の Context から取得できるため実装は容易。

### 各 Effect の実行時間

`resolveEffects` のラップ箇所で `Date.now()` の差分を記録する。タイムアウトやコネクションプール枯渇の原因調査に有用。実装コストも低い。

## 見送りの理由

- context キーは静的にわかるため、キーだけ記録しても付加価値が低い
- context の値のシリアライズは技術的課題が大きい
- 現時点では chain + inputs + cause で十分なデバッグ情報が得られている

## 再検討のタイミング

- 認証導入後、context の値がデバッグに必要になった時点で toString() アプローチを再評価
- 本番環境でのデバッグが必要になった時点でリクエストメタデータと実行時間の追加を検討
