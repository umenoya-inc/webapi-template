# モジュールの公開API制御

`src/modules/` 配下の各モジュールは、他のモジュールに公開する定義を `index.ts` の barrel export に集約する。
他のモジュールからは `@/modules/<module名>` エイリアス経由でのみアクセスし、内部ファイルを直接インポートしてはならない。
モジュールはネスト可能で、各階層の `index.ts` が公開APIとなる。

## 目的

モジュールをカプセル化し、公開インターフェースと内部実装を分離する。内部のリファクタリングが公開APIを変えない限り他モジュールに影響しないことを保証する。また、`@/modules/` エイリアスによりモジュール間の依存方向をimport文から一目で把握できるようにする。

## 例

```typescript
// ✅ エイリアス経由でモジュールのbarrel exportからインポート
import { userStore } from "@/modules/user"

// ✅ ネストされたサブモジュールのbarrel export経由でインポート
import { profileStore } from "@/modules/user/profile"

// ❌ 相対パスでモジュールにアクセス
import { userStore } from "../user"

// ❌ モジュールの内部ファイルに直接アクセス
import { userStore } from "@/modules/user/userStore"

// ❌ サブモジュールの内部ファイルに直接アクセス
import { profileStore } from "@/modules/user/profile/profileStore"
```

## 同一モジュール内

同一モジュール内のファイル同士は、相対パスで内部ファイルを直接インポートしてよい。

```typescript
// ✅ 同一モジュール内での直接インポート（user/userRoute.ts から）
import { userStore } from "./userStore"
```

## モジュールコメント

各モジュールの `index.ts` には、モジュールの概要を JSDoc コメントで記述する。
以下の内容を含めること:

- **モジュールの責務** — このモジュールが扱うドメイン概念や提供する機能
- **エクスポート一覧** — 公開している主要な型・関数の簡潔な説明
- **使い方**（必要に応じて） — 利用側のコード例や注意点

型定義やコードを見れば分かる詳細（フィールド一覧、引数の型等）は省略する。変更のたびにコメントを更新する負担を避け、情報の重複を防ぐ。

サブモジュール（例: `db/user/`）にも同様に記述する。
サブモジュールでは、関数間の使い分けやドメイン上の制約（一意性制約等）など、コードからは読み取りにくい情報を含めると有用。

## Lint

`module-boundary/no-module-internal-import` カスタムoxlintプラグイン（`lint/module-boundary/`）でファイルシステムを参照し、インポート先が barrel export（`index.ts` を持つディレクトリ）か内部ファイルかを判定して強制する。
