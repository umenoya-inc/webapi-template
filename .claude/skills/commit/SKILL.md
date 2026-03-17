---
name: commit
description: コードチェックを実行してからコミットする
allowed-tools: Bash(git *), Bash(npx vp *)
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

### 2. 変更内容の確認

```bash
git status
git diff --staged
git diff
```

### 3. コミット

変更内容を分析し、適切なコミットメッセージを作成する。

- コミットメッセージの末尾に以下を付与する:
  ```
  Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
  ```
- ユーザーが `$ARGUMENTS` でメッセージを指定した場合はそれを使用する
- 指定がない場合は変更内容から適切なメッセージを生成する
- `.env` や認証情報を含むファイルはコミットしない
