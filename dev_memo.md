# dev_memo

## Date
- 2026-02-05 17:13

## 状況
- Obsidian Community Plugin `note-deep-researcher` の骨格実装を作成し、Vault に配置して動作確認を実施。
- モック（Simulated）出力ではあるが、実行→フォルダ作成→Markdownレポート保存まで到達することを確認。

## 進捗（完了したこと）
- プラグインのメタデータ整備
  - `manifest.json` を `note-deep-researcher` に更新
  - `package.json` の名称/説明を更新
  - 外部 `.env` を読む方針のため `isDesktopOnly: true`
- UI
  - リボンアイコン + コマンドパレットから実行可能
  - Reset/Abandon コマンドあり
  - 実行中に再実行した場合の Abandon 確認モーダルあり
- 設定
  - `deepResearchEnabled`
  - `deepResearchPromptPath`
  - `deepResearchNoticeIntervalSec`
  - `deepResearchCheckIntervalSec`
  - `deepResearchEnvFilePath`
  - 実行状態 `currentRun` を永続化
- 出力
  - `<noteBaseName>/<noteBaseName>_deep_research.md` に保存
  - ヘッダ（タイトル + ISO時刻）付与
- ログ
  - `<Vault>/.obsidian/plugins/note-deep-researcher/note-deep-researcher.log` に追記されることを確認

## 動作確認結果（ユーザー確認）
- 保存されたレポート例（本文はモック）
  - `# <noteBaseName> deep research report`
  - `## <timestamp>`
  - `# Simulated Report` / `Deep research completed.`

## 既知の課題
1. モックの完了条件が確率（`Math.random()`）
   - `deepResearchCheckIntervalSec=60` の場合、数分待っても終わらないことがある
   - UX的に「DR中が終わらない」印象になる
   - ただしこれは、モックであるため問題とは言えず一時的な仕様
2. 生成先フォルダの作成タイミング
   - 現状は「完了時」にフォルダを作るため、完了しないとフォルダも出ない
   - ディレクトリ作成（現存時は作成しない）は、終わってからがいいのかスタート時がいいのかは要検討
3. リボンアイコンの視認性
   - 現在のアイコンが他と被りやすく、識別しにくい
4. 実プロバイダ未実装
   - Gemini Deep Research / `interactions.get()` 相当の実API連携は未実装（現状はモック）

## 次回やること（候補）
- モックプロバイダを「必ず完了する」デモ挙動に変更（例: N回目のポーリングで完了）
- 進捗ログ/ステータスログを追加（running/completed/failed を明確に）
- 開始時点で出力フォルダ作成（UX改善）
- リボンアイコンを被りにくいものへ変更（例: `telescope` / `sparkles`）
- プロンプト読み込みを `.obsidian` 配下にも対応したい場合は `vault.configDir` + `adapter.read` を使う実装へ
- 実際のGemini API/SDK/自前 `interactions` API の仕様確定後、[GeminiDeepResearchProvider](cci:2://file:///home/kunihiros/.windsurf/worktrees/note-deep-researcher/note-deep-researcher-8de6be65/src/providers/GeminiDeepResearchProvider.ts:3:0-70:1) を本実装化

## 参考（設定例）
- `deepResearchPromptPath`: `custom_instruction.md`（Vault直下など）
- `deepResearchEnvFilePath`: `/home/<user>/.config/note-deep-researcher/.env`（絶対パス）
- data.json sample
```
{
  "deepResearchEnabled": true,
  "deepResearchPromptPath": "custom_instruction.md", # Vault直下においた例 .obsidian/plugins/note-deep-researcher/ は動作しない
  "deepResearchNoticeIntervalSec": 5,
  "deepResearchCheckIntervalSec": 5,
  "deepResearchEnvFilePath": "/home/kunihiros/.config/note-deep-researcher/.env", # `~` 展開がされないので、絶対パス指定
  "currentRun": null
}
```