## タスク
Gemini Pro 向け依頼: ポートフォリオの「Profile」と「Contact」文面を日本語でブラッシュアップする。構造はそのまま、より端的で信頼感のあるコピーに整えてください。

## コンテキスト
- プロジェクト: Takumi Chiba ポートフォリオ（統合クリエイティブ・パートナー）
- Hero/Works は英語化済み。Profile/Contact の日本語を磨きたい。
- コア価値: Photo × Video × Code × Design × Sound = 統合クリエイティブ・インテリジェンス
- 伝えたいメリット: 翻訳ロスゼロ / 一貫したブランド体験 / スピード / AIネイティブ効率
- ターゲット: 時間の価値を知る美意識の高い決裁者
- 口調: 簡潔・確信・知的。ポエム調は避ける。禁止ワード: 「ワンストップ」「トータルソリューション」「お客様に寄り添う」「最高品質」「プロフェッショナル」

## 現状コピー（リライト対象）
### Contact
- title: 対話を始める
- description: `案件が具体化したときも、まだアイデア段階でも。\n売り込みはしません。ビジョンを教えてください。`
- cta: メールを送る
- responseNote: 返信は48時間以内に。

### Profile
- header.title: Experience & Skills
- header.subtitle: デザインとフロントエンド開発を軸に、映像・写真まで一貫して手がける統合型クリエイター
- strengths:
  1) デザイン × エンジニアリング — UI設計からNext.js実装まで翻訳ロスなし / keywords: Figma, React, Next.js, デザインシステム
  2) エンタープライズ品質 — 大手金融・保険で5層クリーンアーキテクチャ / keywords: クリーンアーキテクチャ, CQRS, AWS, TypeScript
  3) ビジュアル × テクノロジー — 写真/映像の判断がWeb体験に直結 / keywords: Photography, Videography, Three.js, GSAP
- experience（要約）
  - exp-1: 2025.05- / Enterprise DX / フルスタック・リード / Amazon Connect統合問合せ管理、5層CA設計、QuickSight
  - exp-2: 2024.12-2025.03 / 損害保険システム / FE/BE / LINE連携チャット、72名チーム
  - exp-3: 2022.05-2024.12 / SaaS開発 / FEリード / ノーコードSaaS、2年8ヶ月継続
  - exp-4: 2015.04-2022.12 / 新規事業・デザイン / FE/デザイナー / 介護経営支援、7年9ヶ月
  - exp-5: 2018.05-2024.12 / 受託（自社） / 代表 / 要件〜運用、Firebase/Supabase
- techStack: Frontend / Backend & Cloud / Design & Creative / Architecture & Methodology（区分は維持）
- cta: headline: プロジェクトについて相談する / subtext: 技術選定やチーム構成… / buttonLabel: 対話を始める

## 要求
1) 日本語でリライト。冗長表現・ポエム調を排除し、意思決定者がすぐ理解できる端的さに。
2) 構造は維持（フィールド数/配列数を変えない）。語尾・語順・語彙を最適化する。
3) CTAや数値・期間は残す。固有名は不要（NDA配慮）。
4) Profile header/strengths/experience/techStack/cta と Contact の各フィールドを書き換える提案を返す。

## 期待アウトプット（例フォーマット）
```json
{
  "contact": {
    "title": "...",
    "description": "...",
    "cta": "...",
    "responseNote": "..."
  },
  "profile": {
    "header": { "title": "...", "subtitle": "..." },
    "strengths": [
      { "id": "design-engineering", "title": "...", "description": "...", "keywords": [...] },
      ...
    ],
    "experience": [
      { "id": "exp-1", "period": "...", "type": "...", "role": "...", "description": "...", "achievements": [...], "techStack": [...], "teamSize": "..." },
      ...
    ],
    "techStack": [
      { "category": "Frontend", "items": [...] },
      ...
    ],
    "cta": { "headline": "...", "subtext": "...", "buttonLabel": "..." }
  }
}
```
文章のみ更新し、構造・ID・配列長を変えないこと。
