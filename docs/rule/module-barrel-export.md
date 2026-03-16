# モジュールの公開API制御

`src/modules/` 配下の各モジュールは、他のモジュールに公開する定義を `index.ts` の barrel export に集約する。
他のモジュールからは `@/modules/<module名>` エイリアス経由でのみアクセスし、内部ファイルを直接インポートしてはならない。

## 目的

モジュールをカプセル化し、公開インターフェースと内部実装を分離する。内部のリファクタリングが公開APIを変えない限り他モジュールに影響しないことを保証する。また、`@/modules/` エイリアスによりモジュール間の依存方向をimport文から一目で把握できるようにする。

## 例

```typescript
// ✅ エイリアス経由でモジュールのindex.tsからインポート
import { userStore } from "@/modules/user";

// ❌ 相対パスでモジュールにアクセス
import { userStore } from "../user";

// ❌ モジュールの内部ファイルに直接アクセス
import { userStore } from "@/modules/user/userStore";
```

## 同一モジュール内

同一モジュール内のファイル同士は、相対パスで内部ファイルを直接インポートしてよい。

```typescript
// ✅ 同一モジュール内での直接インポート（user/userRoute.ts から）
import { userStore } from "./userStore";
```
