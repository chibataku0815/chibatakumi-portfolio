# 2025-12-05 コンテンツ生成プロンプト（パーソナルデータ活用・apps/web向け）
- 対象モデル: 外部LLM（ユーザーのパーソナルデータ保有想定）
- 対象プロジェクト: `apps/web`
- 目的: サンプル文言を本人ポートフォリオ用の実コンテンツに置き換えるためのコピー/データ生成
- 禁止: コミット指示、実装手順、ビルド/リンター案内

---

## 前提
- サイト構成（既存実装済み）:
  - `/`（トップ）: Hero、ジャンルカード（Motion/Interactive/Installation/Archive/Contact）
  - `/motion`, `/interactive`, `/installation`: ジャンル別作品ショーケース
  - `/archive`: 年/カテゴリリスト
  - `/contact`: CTA（メール/リンク）
- デザイントーン: Pitch Black & Fire（漆黒背景、オフホワイト文字、アクセントにアンバー）
- トランジション: 20ブロック + ロゴストローク。ロゴは後で差し替え。

## 求めるアウトプット
ユーザーのパーソナルデータを活用し、以下のJSONを返してください。すべて日本語/英語併記が望ましい場合は `ja`/`en` を両方埋めてください（片方でよい場合は片方のみでOK）。

```jsonc
{
  "hero": {
    "title": { "ja": "", "en": "" },
    "subtitle": { "ja": "", "en": "" },
    "tagline": { "ja": "", "en": "" } // 任意
  },
  "genres": [
    { "id": "01", "title": "Motion", "desc_ja": "", "desc_en": "" },
    { "id": "02", "title": "Interactive", "desc_ja": "", "desc_en": "" },
    { "id": "03", "title": "Installation", "desc_ja": "", "desc_en": "" },
    { "id": "04", "title": "Archive", "desc_ja": "", "desc_en": "" },
    { "id": "05", "title": "Contact", "desc_ja": "", "desc_en": "" }
  ],
  "motion": [
    { "title": "", "body_ja": "", "body_en": "", "tags": [""] },
    { "title": "", "body_ja": "", "body_en": "", "tags": [""] },
    { "title": "", "body_ja": "", "body_en": "", "tags": [""] }
  ],
  "interactive": [
    { "title": "", "body_ja": "", "body_en": "", "tags": [""] },
    { "title": "", "body_ja": "", "body_en": "", "tags": [""] },
    { "title": "", "body_ja": "", "body_en": "", "tags": [""] }
  ],
  "installation": [
    { "title": "", "body_ja": "", "body_en": "", "tags": [""] },
    { "title": "", "body_ja": "", "body_en": "", "tags": [""] }
  ],
  "archive": {
    "years": [
      { "year": 2024, "entries": [""] },
      { "year": 2023, "entries": [""] }
    ],
    "highlight": { "title": "", "body_ja": "", "body_en": "" }
  },
  "contact": {
    "intro_ja": "", "intro_en": "",
    "cta_label": "", // 例: "メールで連絡", "Let's talk"
    "cta_link": ""   // mailto or URL
  },
  "seo": {
    "title": "", "description": ""
  },
  "logo_notes": {
    "concept": "",        // ロゴコンセプト（抽象記述）
    "stroke_color": "",   // 例: #ededed
    "fill_color": "",     // 例: #ededed または透明
    "path_hint": ""       // 単一パス/複数パス等、書き出し時の留意点
  }
}
```

## 文体・トーン
- シンプルで自信を感じるが、過度に誇張しない。技術的なクリエイティブ感。
- 1文を短く。タグは3〜4語程度。
- Motion/Interactive/Installation は作品の特徴・目的・使用技術を端的に。

## 出力形式
- 上記JSONのみを返すこと。説明文や前置きは不要。
- 未使用フィールドは空文字/空配列で可。
