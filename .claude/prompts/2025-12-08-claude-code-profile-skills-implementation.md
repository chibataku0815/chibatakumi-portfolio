# Profile & Skills ページ実装プロンプト

**対象モデル:** Claude Haiku 4.5
**作成日:** 2025-12-08
**タスク:** スキル・経歴表示機能の実装

---

## タスク概要

ポートフォリオサイトに `/profile` ページを新規作成し、スキル・経歴・年表を表示する。
多くの作品がNDA等で掲載不可のため、**作品ではなくスキルと経歴で信頼性を担保**する設計。

**目標:**
- スキルを「年数羅列」ではなく「価値提案」として表示
- NDA案件を抽象化しつつ信頼性を担保
- 経営者向け（第1層）と技術リード向け（詳細）の二層構造

---

## 禁止事項（重要）

1. **コミット禁止** - `git add` / `git commit` を絶対に実行しない
2. **依存追加禁止** - `npm install` / `bun add` を実行しない
3. **既存構造の破壊禁止** - 現在の Works, Hero, Contact 等は維持

---

## 背景：制約条件

```
【掲載可能な作品】
- 個人プロジェクト
- 公開許可のある案件
- 自社サービス（Adoyosu時代）

【掲載不可の作品】（NDA・契約上）
- NTTデータ Infox
- SOMPOホールディングス
- 株式会社ショーケース
- 株式会社SMS
- その他クライアントワーク多数

→ 作品だけでは信頼性を担保できない
→ スキル・経歴・年表で補完する必要がある
```

---

## 設計方針

### 抽象化と押し出しのバランス

| 情報タイプ | 抽象化レベル | 表示方法 |
|-----------|-------------|---------|
| **企業名（NDA）** | 高 | 「大手金融グループ」「大手SIer」 |
| **プロジェクト内容** | 中 | 「コールセンター基盤構築」（詳細は伏せる） |
| **技術スタック** | 低（押し出す） | 具体的に記載 |
| **成果・インパクト** | 中 | 定量化できるものは記載 |
| **役割** | 低（押し出す） | リード、アーキテクト等を明記 |

### 避けるべき表現

```
❌ スキルバー（JavaScript: 80%）
❌ 年数の羅列だけ（HTML 20年、JS 17年...）
❌ 技術名の列挙だけ（React, Vue, Angular, Node...）
❌ 「できます」型の自己申告
```

### 推奨する表現

```
✓ 技術 + 文脈（「Next.jsでコールセンター基盤を構築」）
✓ 成果ベース（「72名規模チームでの開発経験」）
✓ 統合価値（「デザインからフロントエンドまで一貫」）
✓ 具体的な数字（「2年8ヶ月の継続開発」）
```

---

## 実装内容

### Step 1: 型定義の追加

**ファイル:** `apps/web/src/shared/data/portfolio.ts`

以下の型を追加：

```typescript
// Profile ページ用の型定義

interface ProfileStrength {
  id: string;
  title: string;
  description: string;
  keywords: string[]; // 関連技術キーワード
}

interface ProfileExperience {
  id: string;
  period: string; // "2025.05 - 現在"
  type: string; // "Enterprise DX" | "SaaS開発" | "新規事業" 等
  role: string; // "フルスタックエンジニア / リードエンジニア"
  description: string; // 抽象化された説明
  achievements: string[]; // 成果リスト
  techStack: string[]; // 使用技術
  teamSize?: string; // "72名" 等（任意）
  // 企業名は意図的に含めない（NDA対応）
}

interface ProfileTechCategory {
  category: string; // "Frontend" | "Backend" | "Creative" 等
  items: {
    name: string;
    level: "primary" | "secondary"; // メイン/サブ
    context?: string; // 使用文脈（任意）
  }[];
}

interface ProfilePageContent {
  // ヘッダー
  header: {
    title: string;
    subtitle: string;
  };

  // 3つの強み
  strengths: ProfileStrength[];

  // 経歴（年表）
  experience: ProfileExperience[];

  // 技術スタック
  techStack: ProfileTechCategory[];

  // CTA
  cta: {
    headline: string;
    subtext: string;
    buttonLabel: string;
  };
}
```

---

### Step 2: プロフィールデータの追加

**ファイル:** `apps/web/src/shared/data/portfolio.ts`

`portfolioData.pages` に以下を追加：

```typescript
profile: {
  header: {
    title: "Experience & Skills",
    subtitle: "デザインとフロントエンド開発を軸に、映像・写真まで一貫して手がける統合型クリエイター",
  },

  strengths: [
    {
      id: "design-engineering",
      title: "デザイン × エンジニアリング",
      description: "UIデザインから実装まで一貫して担当。デザイナーとエンジニアの間に生じる「翻訳ロス」をゼロに。Figmaでの設計からNext.js実装まで、同じ頭で考える。",
      keywords: ["Figma", "React", "Next.js", "デザインシステム"],
    },
    {
      id: "enterprise-quality",
      title: "エンタープライズ品質",
      description: "大手金融・保険企業でのシステム開発経験。72名規模の開発チームでの協働、5層クリーンアーキテクチャの設計・導入実績。",
      keywords: ["クリーンアーキテクチャ", "CQRS", "AWS", "TypeScript"],
    },
    {
      id: "visual-technology",
      title: "ビジュアル × テクノロジー",
      description: "写真・映像制作の経験がWeb体験設計に直結。撮影現場での判断が、そのままコードに落ちる。S-Log撮影からカラーグレーディング、WebGL表現まで。",
      keywords: ["Photography", "Videography", "Three.js", "GSAP"],
    },
  ],

  experience: [
    {
      id: "exp-1",
      period: "2025.05 - 現在",
      type: "Enterprise DX",
      role: "フルスタックエンジニア / リードエンジニア",
      description: "大手SIerでのAmazon Connect統合問合せ管理システム開発。5層クリーンアーキテクチャの設計・導入、QuickSightダッシュボード開発を主導。",
      achievements: [
        "5層クリーンアーキテクチャ（UI/State/Service/Query-Command/DB）の設計・導入",
        "CQRSパターンによるクエリ最適化",
        "Playwright E2Eテスト・品質ゲート構築",
      ],
      techStack: ["Next.js 15", "TypeScript", "Drizzle ORM", "PostgreSQL", "AWS Connect", "QuickSight"],
      teamSize: "小規模チーム",
    },
    {
      id: "exp-2",
      period: "2024.12 - 2025.03",
      type: "損害保険システム開発",
      role: "フロントエンド / バックエンドエンジニア",
      description: "大手金融グループの損害保険事案管理システム開発。LINE連携チャットベースコミュニケーション機能の実装を担当。",
      achievements: [
        "保険事故事案の登録・管理機能開発",
        "REST API設計・開発",
        "72名規模チームでの協働経験",
      ],
      techStack: ["Next.js 13", "TypeScript", "Nest.js", "Prisma", "MySQL"],
      teamSize: "72名",
    },
    {
      id: "exp-3",
      period: "2022.05 - 2024.12",
      type: "SaaSプロダクト開発",
      role: "フロントエンドリード",
      description: "ノーコード・ローコードサービスのフロントエンド開発をリード。技術選定からアーキテクチャ設計、ステークホルダー対応まで担当。",
      achievements: [
        "2年8ヶ月の継続的な開発・保守",
        "フォームクリエーター管理画面の設計・実装",
        "生成AIプラグイン for kintone 開発",
      ],
      techStack: ["Remix", "React", "TypeScript", "DynamoDB", "Cognito"],
      teamSize: "8-15名",
    },
    {
      id: "exp-4",
      period: "2015.04 - 2022.12",
      type: "新規事業開発・デザイン",
      role: "フロントエンド / デザイナー",
      description: "介護経営支援プラットフォームの新規事業開発。フロントエンド実装からサイトデザイン、ロゴ制作、UI設計まで一貫して担当。",
      achievements: [
        "7年9ヶ月の長期継続案件",
        "新規事業サイトのデザイン〜フロントエンド一貫担当",
        "デザイナー向け設計共有・育成",
      ],
      techStack: ["Vue.js", "SCSS/BEM", "Figma", "Adobe XD", "Illustrator"],
      teamSize: "20名",
    },
    {
      id: "exp-5",
      period: "2018.05 - 2024.12",
      type: "受託開発（自社）",
      role: "代表 / フルスタックエンジニア",
      description: "技術選定からデザイン・構築まで一貫して担当。複数クライアントへの技術コンサルティング、アーキテクチャ設計を提供。",
      achievements: [
        "要件定義〜運用保守まで全フェーズ対応",
        "Firebase/Supabaseを活用したスピード開発",
        "6年8ヶ月の事業運営",
      ],
      techStack: ["Next.js", "Remix", "Firebase", "Supabase", "Figma"],
    },
  ],

  techStack: [
    {
      category: "Frontend",
      items: [
        { name: "TypeScript", level: "primary", context: "6年" },
        { name: "React / Next.js", level: "primary", context: "5年" },
        { name: "Vue / Nuxt.js", level: "secondary", context: "3年" },
        { name: "Tailwind CSS", level: "primary" },
        { name: "GSAP / Framer Motion", level: "primary" },
        { name: "Three.js / WebGL", level: "secondary" },
      ],
    },
    {
      category: "Backend & Cloud",
      items: [
        { name: "Node.js", level: "primary" },
        { name: "AWS (Connect, QuickSight, Athena, S3)", level: "primary" },
        { name: "Firebase / Supabase", level: "primary" },
        { name: "PostgreSQL / MySQL", level: "secondary" },
        { name: "Drizzle ORM / Prisma", level: "secondary" },
      ],
    },
    {
      category: "Design & Creative",
      items: [
        { name: "Figma", level: "primary", context: "メイン使用" },
        { name: "Adobe Photoshop / Illustrator", level: "secondary" },
        { name: "DaVinci Resolve / Premiere Pro", level: "primary" },
        { name: "Lightroom / Capture One", level: "primary" },
      ],
    },
    {
      category: "Architecture & Methodology",
      items: [
        { name: "クリーンアーキテクチャ（5層設計）", level: "primary" },
        { name: "CQRS", level: "primary" },
        { name: "デザインシステム構築", level: "primary" },
        { name: "monorepo構築", level: "secondary" },
      ],
    },
  ],

  cta: {
    headline: "プロジェクトについて相談する",
    subtext: "技術選定やチーム構成についてもお気軽にご相談ください。売り込みはしません。",
    buttonLabel: "対話を始める",
  },
} as ProfilePageContent,
```

---

### Step 3: /profile ページの作成

**ファイル:** `apps/web/src/app/profile/page.tsx`

```tsx
import { portfolioData } from "@/shared/data/portfolio";
import { AnimatedHeading } from "@/shared/components";

const profile = portfolioData.pages.profile;

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-20 text-center">
          <AnimatedHeading
            as="h1"
            className="mb-6 text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-[-0.02em] text-[var(--text-base)]"
          >
            {profile.header.title}
          </AnimatedHeading>
          <p className="text-lg leading-relaxed text-[var(--text-muted)]">
            {profile.header.subtitle}
          </p>
        </header>

        {/* Strengths Section */}
        <section className="mb-24">
          <h2 className="mb-12 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
            Core Strengths
          </h2>
          <div className="space-y-12">
            {profile.strengths.map((strength, index) => (
              <div
                key={strength.id}
                className="group border-l border-[var(--text-base-20)] pl-6 transition-all duration-300 hover:border-[var(--accent-amber1)]/50"
              >
                <div className="mb-2 flex items-baseline gap-4">
                  <span className="text-sm font-medium text-[var(--text-base-40)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-semibold text-[var(--text-base)]">
                    {strength.title}
                  </h3>
                </div>
                <p className="mb-4 leading-relaxed text-[var(--text-muted)]">
                  {strength.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {strength.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-[var(--bg-overlay-10)] px-3 py-1 text-xs text-[var(--text-base-60)]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience Timeline */}
        <section className="mb-24">
          <h2 className="mb-12 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
            Experience
          </h2>
          <div className="space-y-12">
            {profile.experience.map((exp) => (
              <article
                key={exp.id}
                className="group relative border-l border-[var(--text-base-20)] pl-6 transition-all duration-300 hover:border-[var(--accent-amber1)]/50"
              >
                {/* Period & Type */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-[var(--accent-amber1)]">
                    {exp.period}
                  </span>
                  <span className="rounded-full bg-[var(--bg-overlay-10)] px-3 py-1 text-xs text-[var(--text-base-60)]">
                    {exp.type}
                  </span>
                  {exp.teamSize && (
                    <span className="text-xs text-[var(--text-base-40)]">
                      {exp.teamSize}
                    </span>
                  )}
                </div>

                {/* Role */}
                <h3 className="mb-2 text-lg font-semibold text-[var(--text-base)]">
                  {exp.role}
                </h3>

                {/* Description */}
                <p className="mb-4 leading-relaxed text-[var(--text-muted)]">
                  {exp.description}
                </p>

                {/* Achievements */}
                <ul className="mb-4 space-y-1">
                  {exp.achievements.map((achievement, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--text-base-60)]"
                    >
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent-amber1)]/60" />
                      {achievement}
                    </li>
                  ))}
                </ul>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2">
                  {exp.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded bg-[var(--bg-overlay-5)] px-2 py-0.5 text-xs font-medium text-[var(--text-base-40)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-24">
          <h2 className="mb-12 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
            Tech Stack
          </h2>
          <div className="grid gap-12 md:grid-cols-2">
            {profile.techStack.map((category) => (
              <div key={category.category}>
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-base)]">
                  {category.category}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <span
                        className={`text-sm ${
                          item.level === "primary"
                            ? "text-[var(--text-base)]"
                            : "text-[var(--text-base-60)]"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.context && (
                        <span className="text-xs text-[var(--text-base-40)]">
                          {item.context}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--text-base)]">
            {profile.cta.headline}
          </h2>
          <p className="mb-8 text-[var(--text-muted)]">
            {profile.cta.subtext}
          </p>
          <a
            href="/contact"
            data-transition="true"
            className="amber-border-glow relative inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] px-8 py-4 text-base font-medium text-[var(--text-base)] transition-all duration-300 hover:border-[var(--accent-amber1)]/50 hover:text-[var(--accent-amber1)]"
          >
            {profile.cta.buttonLabel}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </section>
      </div>
    </main>
  );
}
```

---

### Step 4: ナビゲーションへのリンク追加

**ファイル:** `apps/web/src/shared/data/portfolio.ts`

`navigation.links` に追加：

```typescript
navigation: {
  links: [
    // ... 既存のリンク
    { label: "Profile", href: "/profile" },
    // ...
  ],
},
```

---

### Step 5: About セクションから Profile への導線（任意）

**ファイル:** `apps/web/src/shared/data/portfolio.ts`

既存の `pages` に `about` セクションを追加（Home ページ内に表示する場合）：

```typescript
about: {
  headline: "一人で、完結する。",
  body: [
    "写真家として光を捉え、",
    "映像作家として時間を編み、",
    "エンジニアとして体験を構築する。",
  ],
  value: "複数の専門家を介する度に、意図は薄まる。翻訳が重なる度に、本質からは遠ざかる。",
  profileLink: {
    label: "詳細なプロフィール",
    href: "/profile",
  },
},
```

---

## 確認事項

実装完了後、以下を確認：

1. `/profile` ページが正常に表示されること
2. 3つの強みが適切に表示されること
3. 経歴タイムラインが時系列で表示されること
4. 技術スタックがカテゴリ別に表示されること
5. CTAが Contact ページへ遷移すること
6. ナビゲーションに Profile リンクが追加されていること
7. デザイントークン（CSS変数）が正しく適用されていること

---

## 作業完了後

1. 変更内容をユーザーに報告
2. **コミットは行わない** - ユーザーの指示を待つ
3. コピーの微調整があれば対応

---

## 参照ファイル

- `.ai/knowledge/2025-12-07-portfolio-marketing-strategy.md` - マーケティング戦略
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` - タスク進捗
- `apps/web/src/shared/data/portfolio.ts` - 既存のデータ構造
- `apps/web/src/app/contact/page.tsx` - ページ実装の参考

---

## デザイン原則（Pitch Black & Fire）

- **背景:** 漆黒（var(--bg-base)）
- **テキスト:** オフホワイト（var(--text-base)）、ミュート（var(--text-muted)）
- **アクセント:** Amber（var(--accent-amber1)）は「熱源」として控えめに
- **ホバー:** amber-border-glow クラスでグロー効果

---

## NDA対応のポイント

```
【抽象化パターン】
❌ 「NTTデータ Infox」
✓ 「大手SIerでのAmazon Connect統合システム」

❌ 「SOMPOホールディングス」
✓ 「大手金融グループの損害保険システム」

❌ 「株式会社ショーケース おもてなしDX」
✓ 「SaaSプロダクトのフロントエンドリード」

【押し出すポイント】
✓ 技術スタック（具体的に）
✓ 役割（リード、アーキテクト等）
✓ チーム規模（72名等）
✓ 期間（継続性を示す）
✓ 成果（定量化できるもの）
```
