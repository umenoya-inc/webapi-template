# Namespace Import の禁止

`import * as name from "..."` 形式の Namespace Import を禁止し、Named Import を使用する。

## 目的

- Tree-shaking を確実に効かせる
- インポートされるシンボルを明示し、依存関係の把握を容易にする
- コード補完やリファクタリングツールの精度を高める

## 例

```typescript
// ✅ Named Import
import { pipe, string, object, brand } from "valibot"

// ❌ Namespace Import
import * as v from "valibot"
```

## Lint

`import-style/no-namespace-import` カスタム oxlint プラグイン（`lint/import-style/`）で強制する。
