# Photography LP コンバージョン改善 — 引継ぎドキュメント

**作成日**: 2026-03-10
**コミット**: `e75744e` (main)
**目的**: 別チャットセッションが本件の全コンテキストを即座に把握できるようにする

---

## 0. 背景と経緯

### きっかけ
オーナーがInstagram広告（Cafe Cursor Tokyo イベント撮影サービス）を出稿。
LPへのアクセスは発生しているが、問い合わせ（コンバージョン）が0件。
「母集団が少ないだけなのか？」という問いから分析を開始した。

### このチャットで行ったこと
1. **広告データの統計分析** — 二項分布でサンプル不足を定量的に証明
2. **業界ベンチマーク調査** — Gemini Search で日本市場のInstagram広告CVRを取得
3. **LP全体のコードベース調査** — 構造、CTA導線、アナリティクス、フォームフローを網羅
4. **P0改善の実装** — ヒーローCTAのリンク先修正（`/contact` → `#inquiry`）
5. **分析レポートの文書化** — `docs/marketing/2026-03-10-photography-lp-conversion-analysis.md`
6. **コミット＆プッシュ** — `e75744e` で main にマージ済み

---

## 1. Instagram広告の現状データ（2026-03-10 時点）

| 指標 | 値 | 業界平均(日本) | 判定 |
|------|-----|--------------|------|
| ビュー | 522 | — | — |
| ウェブサイトクリック | 13 | — | — |
| CTR | **2.49%** | 0.5〜1.5% | 優秀 |
| CPC | **$0.31 (≈¥47)** | ¥40〜150 | 安い |
| CPM | $7.74 | $5〜15 | 標準 |
| 消化 | $4.04 / $100.00 | — | 消化ペース遅い |
| CV | **0件** | — | — |
| 広告残り | 10日 | — | — |
| オーディエンス | ターゲット選択済み | — | — |

**広告クリエイティブは非常に良好。問題はCTRではなくLP→CV変換。**

---

## 2. 「13クリック / 0CV」の統計的評価

### 二項分布 P(X=0 | n=13, p)

| 仮定CVR | 0CVの確率 | 解釈 |
|---------|----------|------|
| 1% | 87.7% | ほぼ確実に0件 |
| 2% | 76.9% | 普通に起こる |
| 3% | 67.3% | 3回に2回は0件 |
| 5% | 51.3% | コインの表裏 |
| 10% | 25.4% | 4回に1回は0件 |

### 結論
**13クリックではいかなるCVRでも0CVは統計的に正常。最低100クリック必要。**

### 必要サンプル数の目安
- CVR 3%を95%の確率で1件以上観測: **≈100クリック**
- 統計的に有意なABテスト: **200クリック以上**

---

## 3. 構造的にCVが出にくい理由

| 要因 | 詳細 |
|------|------|
| 高単価サービス | イベント撮影 = 数万〜数十万円。即決不可、検討期間が長い |
| Instagram広告の性質 | ファネル上部（認知・興味）。購買意図が低い |
| 初回訪問 | 発見→ブックマーク→比較→再訪問→問い合わせ のサイクル |
| モバイル中心 | IG経由≈100%スマホ。フォーム入力ハードル高 |
| iOS ATT | iOS 14.5以降、コンバージョン計測が過小報告の可能性 |

### 高単価サービスのファネル別ベンチマーク（日本 2025）

```
インプレッション → クリック (CTR):     0.5〜1.0%
LP訪問 → 問い合わせ (LP CVR):         0.5〜1.5%  ← ここが焦点
問い合わせ → 成約:                     20〜40%
広告クリック → 最終成約:               0.1〜0.5%
```

---

## 4. 予算消化ペースのリスク

| シナリオ | 予想総クリック | 期待CV (CVR 1%) |
|---------|--------------|----------------|
| 予算$100使い切り | ≈323 | 3.2件 |
| 現ペース維持 (≈$8) | ≈26 | 0.3件 |

**現ペースだと予算を使い切れず、データ不足で広告終了のリスクがある。**
Instagram広告の機械学習期間（3〜7日）中であれば自然加速する可能性あり。
要確認: 日予算設定が低すぎないか。

---

## 5. LP構成の完全マップ

### ルーティング
- `/photography` (ja) / `/en/photography` (en)
- ページ: `apps/web/src/app/[locale]/photography/page.tsx`
- クライアント統合: `apps/web/src/features/photography/PhotographyClient.tsx`

### セクション構成

```
┌─ HeroSection ─────────────────────────────────┐
│  WebGL背景（hero-video.mp4 / フォールバック画像） │
│  CTA: 「問い合わせを始める」→ #inquiry          │  ← 修正済み（旧: /contact）
│  CTA: 「コンタクトシートを見る」→ #gallery       │
│  Proof Panel: 当日プレビュー/全データ/英語/対応範囲 │
│  Side Panel: Cafe Cursor Tokyo case概要          │
└────────────────────────────────────────────────┘
┌─ GallerySection (#gallery) ────────────────────┐
│  Featured images × 3                            │
│  Contact sheet × 8                              │
│  LightboxDialog（クリック拡大、矢印/ESC操作）    │
└────────────────────────────────────────────────┘
┌─ ServicesSection ──────────────────────────────┐
│  3サービスカード:                                │
│  イベント撮影 / ハイライト動画 / 当日納品         │
│  GSAP: card settle + 3D tilt + icon pop bounce   │
└────────────────────────────────────────────────┘
┌─ TestimonialSection ───────────────────────────┐
│  Cafe Cursor Tokyo case study                   │
│  3カード: Focus / Deliverables / Approach      │
│  GSAP: case card stagger reveal                │
│  数字・引用に頼らない案件導線                    │
└────────────────────────────────────────────────┘
┌─ AboutSection ─────────────────────────────────┐
│  「Why Me」— エンジニア背景の差別化              │
│  3ポイント: コミュニティ理解 / 英語対応 / 高速納品 │
│  GSAP: scroll-driven opacity + card settle       │
└────────────────────────────────────────────────┘
┌─ CTAFormSection (#inquiry) ────────────────────┐
│  左: フォーム説明 + 補足ノート4項目              │
│  右: 6フィールドフォーム                         │
│    必須: 名前 / メール / イベント種別             │
│    任意: 開催日(DatePicker) / 参加人数 / 要望     │
│    隠し: UTM 5項目 + locale + pagePath           │
│  送信: Server Action → Slack Webhook             │
│  成功画面: フォーム置換表示                       │
│  GSAP: form card reveal + submit button glow     │
└────────────────────────────────────────────────┘
```

### 主要ファイル一覧

| ファイル | パス |
|---------|------|
| ページエントリー | `apps/web/src/app/[locale]/photography/page.tsx` |
| クライアント統合 | `apps/web/src/features/photography/PhotographyClient.tsx` |
| ヒーロー | `apps/web/src/features/photography/sections/HeroSection.tsx` |
| ギャラリー | `apps/web/src/features/photography/sections/GallerySection.tsx` |
| サービス | `apps/web/src/features/photography/sections/ServicesSection.tsx` |
| 事例紹介 | `apps/web/src/features/photography/sections/TestimonialSection.tsx` |
| アバウト | `apps/web/src/features/photography/sections/AboutSection.tsx` |
| CTAフォーム | `apps/web/src/features/photography/sections/CTAFormSection.tsx` |
| Lightbox | `apps/web/src/features/photography/sections/LightboxDialog.tsx` |
| Server Action | `apps/web/src/features/photography/actions.ts` |
| アナリティクス | `apps/web/src/shared/analytics/index.ts` |
| ページトラッカー | `apps/web/src/shared/analytics/AnalyticsPageTracker.tsx` |
| 翻訳(ja) | `apps/web/messages/ja.json` (photography.* = 154キー) |
| 翻訳(en) | `apps/web/messages/en.json` |
| Hero WebGL | `apps/web/src/features/photography/components/PhotographyHeroLightLayer.tsx` |

### 技術スタック

- Next.js App Router + next-intl 4.8.3
- Tailwind CSS 4 + CSS custom properties
- GSAP + ScrollTrigger（11箇所）
- Server Action (useActionState) → Slack Webhook (Block Kit)
- GA4 (`page_view`, `generate_lead`) + Meta Pixel (`PageView`, `Contact`)
- WebGL (Three.js) hero + 低スペック/モバイルフォールバック
- JSON-LD (ProfessionalService + ImageGallery)

---

## 6. フォーム送信フロー（技術詳細）

```
ユーザーがフォーム送信
  ↓
CTAFormSection (useActionState)
  ↓
submitPhotographyInquiry (Server Action)
  ├─ バリデーション
  │   ├─ name: 2文字以上
  │   ├─ email: 正規表現チェック
  │   └─ eventType: 必須
  ├─ Slack Webhook POST (Block Kit)
  │   └─ Header + Name/Email + EventType/Date + Attendees/Locale/Page + UTM + Details + Timestamp(JST)
  └─ state 返却 (success | error | fieldErrors)
  ↓
成功時:
  ├─ trackPhotographyLead() → GA4 generate_lead + Meta Pixel Contact
  └─ フォーム → 成功画面に置換

開発時:
  └─ SLACK_WEBHOOK_URL 未設定 → console.log + 自動成功返却
```

### 環境変数

```
SLACK_WEBHOOK_URL          # Slack通知（必須）
NEXT_PUBLIC_GA_MEASUREMENT_ID  # GA4（任意）
NEXT_PUBLIC_META_PIXEL_ID      # Meta Pixel（任意）
```

---

## 7. 完了済みの改善（P0）

### 修正内容: ヒーローCTAのリンク先変更

**Before**:
```tsx
// HeroSection.tsx
<Link href="/contact" data-transition="true" ...>
  {t("ctaBook")}
</Link>
```
→ 別ページ `/contact` に遷移。IG広告→LP→/contact と2回ナビゲーションが必要で離脱ポイント。

**After** (コミット `e75744e`):
```tsx
// HeroSection.tsx
<a href="#inquiry" ...>
  {t("ctaBook")}
</a>

// CTAFormSection.tsx
<section id="inquiry" ref={sectionRef} ...>
```
→ 同一ページ内のフォームセクションへスムーズスクロール。遷移0回。

**変更ファイル**:
- `apps/web/src/features/photography/sections/HeroSection.tsx` — `<Link>` → `<a href="#inquiry">`、import削除
- `apps/web/src/features/photography/sections/CTAFormSection.tsx` — `id="inquiry"` 追加

**ビルド**: 成功確認済み

---

## 8. 未対応の改善提案（優先度順）

### P1: 高優先度（今週中に対応推奨）

| # | 改善 | 理由 | 実装イメージ |
|---|------|------|-------------|
| 3 | **モバイルフローティングCTAボタン** | IG経由≈100%スマホ。ページ下部のフォームまでの距離が長い | 画面下部固定の `position: fixed` ボタン。`#inquiry` へスクロール。スクロール位置でフォーム近くなら非表示 |
| 4 | **マイクロCV導線追加（LINE公式等）** | フォーム送信は高ハードル。低ハードルな接点が必要 | LINE友だち追加ボタン / 無料相談予約リンク |
| 5 | **Meta Pixelリマーケティング広告** | Meta Pixel設置済み。初回訪問者を再ターゲティングすればCVR数倍 | Instagram広告管理画面で設定（コード変更不要） |

### P2: 中優先度（50クリック到達後）

| # | 改善 | 理由 |
|---|------|------|
| 6 | 緊急性の表示（「今月の空き枠残りX件」） | 行動を促すトリガー |
| 7 | フォームステップ分割 | 名前+メール → 詳細。初回入力ハードルを下げる |
| 8 | GA4スクロール深度・滞在時間の計測 | LP内の離脱ポイントを特定 |

### P3: 低優先度（100クリック以上）

| # | 改善 | 理由 |
|---|------|------|
| 9 | ABテスト（ヘッドライン、CTA文言） | 統計的に有意な比較には200+クリック必要 |
| 10 | LPバリアント（短縮版 vs フル版） | IG経由ユーザーは短い方が良い可能性 |

---

## 9. 判断タイムライン

| マイルストーン | 時期目安 | アクション |
|--------------|---------|-----------|
| 現在（13クリック） | 2026-03-10 | P0完了。パニック不要。予算消化ペース確認 |
| 50クリック | +数日 | 初期トレンド確認。CVR 0%ならP1を本格検討 |
| 100クリック | +1週間前後 | CVR推定可能に。P2の施策を判断 |
| 200クリック以上 | 予算次第 | ABテスト等の高度な最適化が可能 |

---

## 10. ROI試算

イベント撮影 1件 = ¥100,000 仮定:

| CVR | 必要クリック | CPC $0.31 での広告費 | ROAS |
|-----|------------|---------------------|------|
| 1% | 100 | ≈¥4,700 | 2,128% |
| 0.5% | 200 | ≈¥9,400 | 1,064% |
| 0.3% | 333 | ≈¥15,600 | 641% |

**予算$100 (≈¥15,000) で1件でも受注できれば十分にペイする。**

---

## 11. 関連ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/marketing/2026-03-10-photography-lp-conversion-analysis.md` | 分析レポート本体 |
| `docs/marketing/2026-03-10-cafe-cursor-instagram-ads-brief.md` | 広告ブリーフ |
| `docs/marketing/2026-03-10-cafe-cursor-instagram-ads-creative.md` | 広告クリエイティブ |
| `docs/marketing/2026-03-10-cafe-cursor-instagram-ads-analytics.md` | 広告KPIテンプレート |
| `docs/photography/photography-redesign-handoff.md` | LPデザイン変更の全体像 |
| `docs/photography/photography-i18n-handoff.md` | i18n実装の詳細 |

---

## 12. 別チャットで次に行うべきこと

### すぐに着手可能
1. **P1 #3: モバイルフローティングCTAボタンの実装**
   - 対象: `PhotographyClient.tsx` に新コンポーネント追加
   - `#inquiry` へのスムーズスクロール
   - IntersectionObserver でフォーム近接時に非表示

2. **P1 #4: マイクロCV導線の設計**
   - LINE公式アカウントの準備（オーナー判断必要）
   - CTAFormSection に低ハードル選択肢を追加

### オーナー判断が必要
3. **予算消化ペースの確認・調整** — Instagram広告管理画面で日予算確認
4. **Meta Pixelリマーケティング広告の設定** — 広告管理画面で設定
5. **LINE公式アカウントの開設有無**

### データ蓄積後
6. 50クリック到達時の再評価
7. GA4データの確認（滞在時間、スクロール深度）
