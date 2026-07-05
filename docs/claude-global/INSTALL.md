# グローバル設定の導入手順（Windows）

リポジトリ内で管理しているグローバル設定・スキルを、
Windows 機の `C:\Users\saoki\.claude\` に反映する手順。

## 何を配布するか
| リポジトリ内のパス | コピー先 | 用途 |
|---|---|---|
| `docs/claude-global/CLAUDE.md` | `C:\Users\saoki\.claude\CLAUDE.md` | 全プロジェクト共通の指示 |
| `.claude/skills/deep-reasoning/` | `C:\Users\saoki\.claude\skills\deep-reasoning\` | 思考フレームワーク（全プロジェクトで使う場合） |
| `.claude/skills/code-review/` | `C:\Users\saoki\.claude\skills\code-review\` | レビュー観点（全プロジェクトで使う場合） |

※ このリポジトリで作業する分にはコピー不要（プロジェクトの `.claude/skills/` が自動で読まれる）。
コピーは「他のプロジェクトでも同じスキルを使いたい」場合のみ。
※ code-review スキルの第 8 節はこのリポジトリ固有なので、グローバルに置く場合は
汎用部分（1〜7 節）だけ残す編集を推奨。

## PowerShell 手順
リポジトリのルートで実行：

```powershell
# グローバル CLAUDE.md（既存があれば上書き前に確認すること）
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude" | Out-Null
Copy-Item docs\claude-global\CLAUDE.md "$env:USERPROFILE\.claude\CLAUDE.md"

# スキル（全プロジェクト共通で使いたい場合のみ）
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null
Copy-Item -Recurse -Force .claude\skills\deep-reasoning "$env:USERPROFILE\.claude\skills\"
Copy-Item -Recurse -Force .claude\skills\code-review "$env:USERPROFILE\.claude\skills\"
```

## 更新の流れ
1. 変更はまずリポジトリ側（`docs/claude-global/` と `.claude/skills/`）を編集して commit
2. 上記 PowerShell を再実行して Windows 側に反映
3. Windows 側だけを直接編集しない（リポジトリが常に正）

## なぜリポジトリ内で管理するのか
クラウドセッション（Claude Code on the web）は使い捨てコンテナで動くため、
コンテナの `~/.claude/` に置いた設定はセッション終了で消える。
git 管理されたファイルだけが永続する。プロジェクトの `.claude/` は
クラウド・ローカルの両方のセッションで自動的に読み込まれる。
