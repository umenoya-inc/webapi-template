---
name: commit
description: コードチェックを実行してからコミットする
allowed-tools: Bash(git *), Bash(npx vp *), Bash(specdrift *), Read
---

## コミット手順

以下の手順でコミットを行う。

### 1. コードチェック

`vp check`（lint + fmt + 型チェック）とテストを実行する。

```bash
npx vp check --fix
npx vp test
```

フォーマットは自動修正される。lint・型チェック・テストのいずれかが失敗した場合はコミットせず、修正内容をユーザーに報告する。

### 2. specdrift チェック

```bash
specdrift check 'docs/**/*.md'
```

DRIFT が検出された場合、すぐに `specdrift update` しない。まず差分のある仕様と変更されたソースを読み、仕様の文面を修正する必要があるか判断する。必要なら仕様を修正してから `specdrift update` でハッシュを同期する。

update 時は必ず `--reason` を付け、判断の根拠を記録する:

```bash
specdrift update --reason '仕様の文面修正不要: リファクタリングのみで振る舞い変更なし' 'docs/**/*.md'
```

### 3. ドキュメンテーション影響チェック

変更されたソースファイルに対して逆引きグラフを実行し、関連ドキュメントの更新が必要か確認する。

```bash
specdrift graph --reverse 'docs/**/*.md'
```

- 変更したソースが逆引きで表示された場合、そのドキュメントが今回の変更に追従できているか確認する（specdrift check で DRIFT として検出済みのものは Step 2 で対応済み）
- 変更したソースが逆引きに表示されない場合、ドキュメントで追跡すべき変更かどうかを判断する。追跡が必要なら該当ドキュメントにアノテーションを追加する

### 4. 変更内容の確認

```bash
git status
git diff --staged
git diff
```

### 5. コミット

変更内容を分析し、適切なコミットメッセージを作成する。

- コミットメッセージの末尾に以下を付与する:
  ```
  Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
  ```
- ユーザーが `$ARGUMENTS` でメッセージを指定した場合はそれを使用する
- 指定がない場合は変更内容から適切なメッセージを生成する
- `.env` や認証情報を含むファイルはコミットしない
