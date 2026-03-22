---
name: check-hover
description: インフラ関数の hover 可読性を定性的に検証し、lint では検出できない問題を洗い出す
allowed-tools: Bash(npx vp *), Glob, Grep, Read, LSP
---

## あなたのタスク

インフラ関数（`defineEffect`, `defineContract`, `defineRouteContract`）の呼び出し結果に対する LSP hover の可読性を定性的に検証し、改善余地を報告してください。

**このスキルは読み取り専用です。コードの修正は行わないでください。**

### lint ルールとの棲み分け

型の展開コストの定量的な検出は `type-complexity/type-expansion-cost` lint ルールが担当する（`npx vp check` で自動実行）。このスキルは lint では拾えない以下の定性的な問題を検査する:

- hover に内部構造（ブランド型等）が露出していないか
- hover の表示が truncation されていないか
- 同じ型情報が二重に展開されていないか
- hover から型の意図が読み取れるか

### Step 1: 検査対象の収集

`src/` 以下から、以下のパターンに該当する行を収集する。

```
export const <name> = defineEffect(
export const <name> = defineContract(
export const <name> = defineRouteContract(
```

各ファイルのパスと `export const` の行番号・エクスポート名を記録する。

### Step 2: hover の取得

Step 1 で収集した各エクスポートに対して、LSP hover を取得する。
hover の対象はエクスポート名（`export const` の直後の識別子）。

### Step 3: 可読性の評価

各 hover 結果を以下の基準で評価する。

#### 問題あり（要改善）

- **truncation**: hover 内に `...` が含まれている（型が途中で省略されている）
- **intersection の露出**: hover 内に `& EffectBrand<` や `& BehaviorBrand` が含まれている（名前付き interface で止まっていない）
- **二重展開**: 同じ型情報が callable signature と brand の両方に展開されている

#### 注意（経過観察）

- **hover の行数が 20 行を超えている**: 型自体は正しいが、ネストが深い可能性がある
- **子 Effect の Fn 型パラメータが展開されている**: 子の contract 内容が親の hover に漏れている

#### 良好

- hover がトップレベルで `LeafEffect<...>`, `ServiceEffect<...>`, `ContractWithInput<...>` 等の名前付き interface で始まっている
- truncation がない

### Step 4: レポートの出力

以下のフォーマットで出力する。

```
# Hover 可読性レポート

検査日: YYYY-MM-DD
検査対象: N 件

## サマリー

- 良好: N 件
- 注意: N 件
- 要改善: N 件

## 要改善

### <ファイルパス>: <エクスポート名>
**問題:** （truncation / intersection の露出 / 二重展開）
**hover:**
（hover の内容をコードブロックで表示）
**推奨アクション:** （どの型を interface 化すべきか等）

## 注意

### <ファイルパス>: <エクスポート名>
**理由:** （hover 行数超過 / Fn 展開）
**hover:**
（hover の内容をコードブロックで表示）

## 良好

（ファイルパスとエクスポート名の一覧のみ）
```

### 注意事項

- コードの修正は行わないこと
- 推奨アクションは具体的に（どの型をどう変更すべきか）記述すること
- 新しいインフラ関数が追加された場合にも対応できるよう、パターンマッチは柔軟に行うこと
