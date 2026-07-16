# MEMORY.md — セッション横断の学び・注意点

Claude（後継モデル含む）が本リポジトリで作業して得た知見の蓄積場所。
**新しい学び・ハマりどころを見つけたら本ファイルに追記して commit すること**（1 項目 2〜4 行で簡潔に）。

## 2026-07-05 引き継ぎスプリント（Fable 5）での学び

### 調査・情報の扱い
- **サブエージェントの調査報告は鵜呑みにしない**。本スプリントでは並列調査の 1 本が
  実在しない構成（別アプリの構造）を報告してきた。ドキュメントに書く前に必ず
  主要ファイルを自分で開いて裏を取ること（package.json・対象ファイル数行の直読で十分）
- README は初期仕様のアーカイブであり現状と乖離している。現状把握は
  docs/architecture.md → CLAUDE.md → コードの順が最短
- 品番の正誤判断の出典はルート直下の Excel（engcon Japan Prices…xlsx）・
  Part list CSV・ユーザー指示のみ。git log の過去修正コミット（bb6aa69 等）も判断材料になる

### 環境・運用
- クラウドセッションは使い捨てコンテナ。**ファイルに残らない作業は消える**ので
  こまめに commit する（使用量上限による中断が実際に起きた。commit 済み分は無傷だった）
- スケジューラ系 MCP ツール（send_later / create_trigger）はこの環境では承認が必要で
  非対話セッションからは使えない。中断復帰は「TaskList + プランファイル + 本ファイル」で
  状態を永続化しておき、ユーザーの一言で再開できる形にしておくのが現実解
- セッション開始時の npm ci は .claude/hooks/session-start.mjs が自動実行する
- push 後のデプロイ確認は Vercel MCP（list_deployments → get_deployment_build_logs）。
  main が本番、ブランチ push はプレビューデプロイになる。PR の vercel[bot] コメントが
  Ready/Failed になるのでそれでも判定できる
- クラウドセッションから api.github.com への直接 curl はプロキシで空応答になる。
  CI 状態の確認は GitHub MCP ツール（actions_list 等）を使うこと（curl ポーリングは無駄）

### コードベース固有
- 標準構成の品目生成は lib/standardConfig.ts（純関数）+ Step5ItemList（価格解決）に
  分離済み。**品番マップを変えたら lib/standardConfig.test.ts も必ず更新**
- lib/pricing.ts の数値はテストで固定してある。テストの期待値を変える PR は
  ADR-0001 改訂とユーザー承認が必須（機械がミスを捕まえる構造なので、テストを
  「とりあえず通す」ために書き換えるのは厳禁）
- Supabase の quotes/quote_items は SELECT ポリシーが無い（読めるのは service role のみ）。
  「anon で読めない」のは仕様であってバグではない
- .ts/.tsx を編集すると hooks が tsc + lint を自動実行する。遅いと感じても外さないこと
  （外したくなったらユーザーに提案）

### ユーザーとの合意事項（2026-07-05）
- PDF 生成はしない（ADR-0002）
- 成果物はすべてリポジトリ内に集約（コンテナの ~/.claude/ は揮発するため）
- 失われた外部 spec 2 本は git 履歴から docs/specs/ui-brand-current-state.md に再構築済み
- 報告は日本語・結論先行・選択肢は理由とトレードオフ付き
