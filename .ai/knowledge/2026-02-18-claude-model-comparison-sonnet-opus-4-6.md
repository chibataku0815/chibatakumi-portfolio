# Claude Model比較: Sonnet 4.6 (1M) vs Opus 4.6

**日付:** 2026-02-18
**カテゴリ:** AI モデル選定, 開発効率
**状態:** 調査完了
**鮮度:** 🟢 最新（2026-02-18時点）

---

## 概要

2026年2月リリースのClaude Sonnet 4.6とOpus 4.6の性能比較・使い分け指針。
Figma連携（Code to Canvas）を含む最新エコシステム情報。

---

## ベンチマーク比較

| カテゴリ | Opus 4.6 | Sonnet 4.6 | 勝者 |
|---------|----------|------------|------|
| 複雑な推論 (GPQA) | 高スコア | 競争力あり | **Opus** |
| コーディング (SWE-Bench) | SOTA | 強い | **Opus** |
| 数学 (AIME 2025) | 優秀 | 強い | **Opus** |
| オフィス業務 (GDPval-AA) | 強い | 優秀 | **Sonnet** |
| 金融分析エージェント | 良好 | 最高レベル | **Sonnet** |
| 長文検索 (MRCR v2 1M 8-needle) | **76%** | 18.5% | **Opus（圧倒的）** |
| フロントエンド生成品質 | 良好 | 優秀 | **Sonnet** |
| コンピュータ操作 | 良好 | 94%精度 | **Sonnet** |

### ユーザー評価

- Sonnet 4.6 vs Sonnet 4.5: **70%がSonnet 4.6を支持**
- Sonnet 4.6 vs Opus 4.5: **59%がSonnet 4.6を支持**
- 理由: 指示追従性向上、ハルシネーション減少、過剰実装の削減

---

## 価格

| モデル | 入力 (per 1M tokens) | 出力 (per 1M tokens) | 比率 |
|-------|---------------------|---------------------|------|
| Sonnet 4.6 | $3.00 | $15.00 | 1x |
| Opus 4.6 | $5.00 | $25.00 | ~1.7x |

Sonnetは約**40%安い**。

---

## Sonnet 4.6の強み

1. **フロントエンド品質** — UI視覚的完成度がOpusを上回る、少ないイテレーションで完成
2. **指示追従性** — 過剰実装（overengineering）が少なく指示通りに動く
3. **オフィス業務・事務自動化** — スプレッドシート処理、フォーム入力でOpus超え
4. **金融分析エージェント** — 四半期報告書の読み取り・表抽出で最高性能
5. **コスト効率** — 高トラフィックアプリで$3 vs $5の差が効く
6. **レイテンシ** — ユーザー向けアプリで応答が速い
7. **Adaptive Thinking / Extended Thinking** — API側で両方サポート
8. **Context Compaction** — ベータ機能、古いコンテキストを自動要約

## Opus 4.6の強み

1. **深い推論** — 複雑な多段階推論、数学、ロジック
2. **大規模コードベースのリファクタリング** — アーキテクチャ設計・全体理解
3. **長文コンテキスト検索精度** — 76% vs 18.5%で圧倒的差
4. **マルチエージェント調整** — 複数エージェントの協調タスク
5. **法律・医療文書分析** — 見落としが許されない高精度検索

---

## Figma連携: Code to Canvas

### 概要

2026年2月17日発表。Figma × Anthropicパートナーシップによる「Code to Canvas」機能。

### ワークフロー

1. Claude Codeでブラウザ上にUIを構築
2. ライブ状態をキャプチャ → Figma互換フレームに変換
3. Figmaキャンバスに**編集可能なデザインデータ**として貼り付け（フラット画像ではない）
4. チームで比較・注釈・意思決定

### 技術基盤: 2つのMCPサーバー

| サーバー | URL | 主機能 |
|---------|-----|--------|
| **Remote MCP（figma）** | `https://mcp.figma.com/mcp` | Code to Canvas + デザイン読み取り |
| **Desktop MCP（figma-desktop）** | `http://127.0.0.1:3845/mcp` | 選択ノードのコード生成・メタデータ取得 |

### Remote MCP ツール（figma）

- `generate_figma_design` — **Web → Figma キャプチャ（Code to Canvas の本体）**
- その他のデザイン読み取り系ツール

### Desktop MCP ツール（figma-desktop）

| ツール | 説明 |
|--------|------|
| `get_design_context` | ノードのUIコード生成（メイン） |
| `get_screenshot` | ノードのスクリーンショット |
| `get_metadata` | ノード/ページのメタデータ（XML） |
| `get_variable_defs` | 変数定義（色、フォント、サイズ等） |
| `create_design_system_rules` | デザインシステムルール生成 |
| `get_figjam` | FigJamノードのコード生成 |

### Code to Canvas の実際のワークフロー（実証済み 2026-02-18）

1. `generate_figma_design`（Remote MCP）でキャプチャID発行
2. `layout.tsx`にキャプチャスクリプトを一時注入: `https://mcp.figma.com/mcp/html-to-design/capture.js`
3. ブラウザでキャプチャURL（`#figmacapture=<id>&figmaendpoint=...`）を開く
4. キャプチャ完了後、`generate_figma_design`でFigmaファイルURL取得
5. キャプチャスクリプトを削除

**結果:** レイヤー構造・Auto Layout付きの編集可能なFigmaフレームとして生成される

### 双方向機能

| 方向 | 機能 | MCPサーバー |
|------|------|------------|
| Web → Figma | `generate_figma_design` でブラウザUIをキャプチャ | Remote |
| Figma → Code | `get_design_context` で選択フレームからコード生成 | Desktop |
| デザイントークン取得 | `get_variable_defs` で変数定義を読み取り | Desktop |
| FigJam連携 | `get_figjam` でダイアグラムからコード生成 | Desktop |

---

## ポートフォリオ開発での使い分け指針

| シナリオ | 推奨モデル | 理由 |
|---------|-----------|------|
| コンポーネント実装・UI作成 | **Sonnet 4.6** | フロントエンド品質高い、過剰実装少ない |
| 大規模リファクタリング | **Opus 4.6** | 深い推論とコードベース全体理解 |
| バグ修正・小タスク | **Sonnet 4.6** | コスパと速度 |
| 長大なコード全体を読んで修正 | **Opus 4.6** | 1M検索精度76% vs 18.5% |
| エージェント的ワークフロー | **Sonnet 4.6** | エージェント計画能力が高い |
| 複雑なアルゴリズム設計 | **Opus 4.6** | GPQA・AIMEで優位 |
| Figma連携・デザイン反復 | **Sonnet 4.6** | UI品質・速度・コスト |

### Claude Codeでの切り替え

```
/model                    # モデル選択メニュー
claude-sonnet-4-6         # Sonnet 4.6
claude-opus-4-6           # Opus 4.6
```

---

## ソース

- [Introducing Claude Sonnet 4.6 - Anthropic](https://www.anthropic.com/news/claude-sonnet-4-6)
- [What's new in Claude 4.6 - Claude API Docs](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-6)
- [Figma partners with Anthropic - CNBC](https://www.cnbc.com/2026/02/17/figma-anthropic-ai-code-designs.html)
- [Claude Code to Figma: Code to Canvas - Muzli](https://muz.li/blog/claude-code-to-figma-how-the-new-code-to-canvas-integration-works/)
- [Think Outside of the Box - Figma Blog](https://www.figma.com/blog/think-outside-of-the-box-with-claude-and-figjam/)
- [Anthropic's Claude Sonnet 4.6 - Axios](https://www.axios.com/2026/02/17/anthropic-new-claude-sonnet-faster-cheaper)
- [Claude Opus 4.6 Analysis - Medium](https://medium.com/data-science-collective/claude-opus-4-6-what-actually-changed-and-why-it-matters-1c81baeea0c9)
