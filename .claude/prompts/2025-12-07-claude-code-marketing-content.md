# マーケティング戦略適用: コンテンツ更新プロンプト

**対象モデル:** Claude Haiku 4.5
**作成日:** 2025-12-07
**タスク:** ポートフォリオコンテンツのマーケティング最適化

---

## タスク概要

先に策定したマーケティング戦略に基づき、ポートフォリオサイトのコンテンツ（コピー、CTA、About等）を更新する。
「統合クリエイティブ・パートナー」としてのポジショニングを明確に伝えるコンテンツに刷新する。

**目標:**
- Hero のタグラインを戦略的なコピーに変更
- Contact ページの CTA を最適化
- 価値提案を明確に伝えるメッセージング

---

## 禁止事項（重要）

1. **コミット禁止** - `git add` / `git commit` を絶対に実行しない
2. **依存追加禁止** - `npm install` / `bun add` を実行しない
3. **既存の構造を維持** - データ構造やコンポーネント構造は変更しない

---

## 戦略的背景

### Core Value（掛け算の価値）

```
Photo × Video × Code × Design × Sound
= 統合クリエイティブ・インテリジェンス

クライアントへのメリット:
- 翻訳ロスゼロ（一人で完結）
- 一貫したブランド体験
- 圧倒的スピード
- AIネイティブ効率
```

### ターゲット心理

```
美意識の高い経営者 / 決裁権者
- 時間の価値を知っている
- 品質を見抜く目がある
- 「分かってくれる」クリエイターを探している
```

### ユーザージャーニー

```
Intrigue → Recognition → Discovery → Realization → Action
(好奇心)   (同類認識)   (発見・驚き)  (価値理解)    (行動)
```

---

## 変更内容

### Step 1: portfolioData の Hero コンテンツ更新

**ファイル:** `apps/web/src/shared/data/portfolio.ts`

**変更前:**
```ts
hero: {
  title: "Takumi Chiba",
  tagline: "コードを書く。撮る。編む。",
  scrollText: "Scroll",
},
```

**変更後:**
```ts
hero: {
  title: "Takumi Chiba",
  tagline: {
    lines: [
      "コードを書く。",
      "撮る。",
      "編む。",
    ],
    // 代替案（より戦略的な場合）:
    // lines: [
    //   "Visual",
    //   "× Technology",
    //   "× Sound",
    // ],
  },
  scrollText: "Scroll",
  // 追加: サブタグライン（必要に応じて）
  subTagline: "一人の視点で、すべてを形に。",
},
```

**注:** tagline を配列に変更する場合、HeroText.tsx での参照も更新が必要。
現状のまま維持し、HeroText 側でハードコードする方が影響が少ない。

---

### Step 2: Contact ページのコンテンツ更新

**ファイル:** `apps/web/src/shared/data/portfolio.ts`

**変更前:**
```ts
contact: {
  title: "Let's Talk",
  description: "Have a project in mind? Let's discuss how we can work together.",
  email: "hello@takumichiba.com",
  cta: "Send Message",
},
```

**変更後:**
```ts
contact: {
  title: "対話を始める",
  description: `次のプロジェクトが見えてきた時に。
あるいは、まだ漠然としたアイデアの段階でも。

売り込みはしません。
あなたのビジョンを聞かせてください。`,
  email: "hello@takumichiba.com",
  cta: "メールを送る",
  // 追加: レスポンス期待値
  responseNote: "返信は48時間以内に。",
},
```

---

### Step 3: Contact ページの UI 更新

**ファイル:** `apps/web/src/app/contact/page.tsx`

**変更後のコンポーネント構造:**

```tsx
import { portfolioData } from "@/shared/data/portfolio";
import { AnimatedHeading } from "@/shared/components";

const contact = portfolioData.pages.contact;

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        {/* Title */}
        <AnimatedHeading
          as="h1"
          className="mb-8 text-[clamp(2.5rem,8vw,4rem)] font-semibold tracking-[-0.02em] text-[var(--text-base)]"
        >
          {contact.title}
        </AnimatedHeading>

        {/* Description - 複数行対応 */}
        <div className="mb-12 space-y-4">
          {contact.description.split('\n\n').map((paragraph, i) => (
            <p
              key={i}
              className="text-lg leading-relaxed text-[var(--text-muted)]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* CTA Button */}
        <a
          href={`mailto:${contact.email}`}
          className="amber-border-glow relative inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] px-8 py-4 text-base font-medium text-[var(--text-base)] transition-all duration-300 hover:border-[var(--accent-amber1)]/50 hover:text-[var(--accent-amber1)]"
        >
          {contact.cta}
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

        {/* Response Note */}
        {contact.responseNote && (
          <p className="mt-6 text-sm text-[var(--text-base-40)]">
            {contact.responseNote}
          </p>
        )}
      </div>
    </main>
  );
}
```

---

### Step 4: Works アイテムのコピー改善

**ファイル:** `apps/web/src/shared/data/portfolio.ts`

**変更前:**
```ts
works: {
  items: [
    {
      id: "01",
      title: "Digital Experiences",
      meta: "Web Development",
      description: "Creating immersive web experiences with cutting-edge technologies.",
    },
    // ...
  ],
},
```

**変更後（より具体的で価値を伝えるコピー）:**
```ts
works: {
  items: [
    {
      id: "01",
      title: "Digital Experiences",
      meta: "Web Development",
      description: "デザインとコードを同じ頭で考える。美しいものを美しいままコードに落とし、あなたのビジョンをそのまま画面に。",
    },
    {
      id: "02",
      title: "Creative Engineering",
      meta: "Technical Direction",
      description: "「技術的に無理」と言われた瞬間から始まる。可能性の限界を押し広げ、想像を現実にする。",
    },
    {
      id: "03",
      title: "Design Systems",
      meta: "Visual Identity",
      description: "一貫したブランド体験のための設計。写真、映像、Webが同じ「声」で語りかける。",
    },
    {
      id: "04",
      title: "Motion & Interaction",
      meta: "Experience Design",
      description: "静止画が動き出す瞬間。音と映像とコードが交差する体験を設計する。",
    },
  ],
},
```

---

### Step 5: 型定義の更新（必要に応じて）

**ファイル:** `apps/web/src/shared/data/content.types.ts`

**追加:**
```ts
export interface ContactContent {
  title: string;
  description: string;
  email: string;
  cta: string;
  responseNote?: string;  // 追加
}

export interface HeroContent {
  title: string;
  tagline: string | { lines: string[] };  // 配列対応（オプション）
  scrollText: string;
  subTagline?: string;  // 追加
}
```

---

### Step 6: About セクション追加（将来対応）

**注:** 現在のホームページには About セクションがない。
マーケティング戦略で定義した About コピーを実装する場合:

**portfolioData への追加:**
```ts
about: {
  headline: "一人で、完結する。",
  body: [
    "写真家として光を捉え、",
    "映像作家として時間を編み、",
    "エンジニアとして体験を構築する。",
    "",
    "これらは別々のスキルではない。",
    "一つの視点が、異なる媒体で表現されるだけだ。",
    "",
    "複数の専門家を介する度に、意図は薄まる。",
    "翻訳が重なる度に、本質からは遠ざかる。",
    "",
    "あなたのビジョンを、",
    "そのまま形にできる人間がここにいる。",
  ],
},
```

**実装は別タスクで対応。**

---

## 確認事項

実装完了後、以下を確認:

1. Hero のタグラインが3行に分離されていること
2. Contact ページのコピーが更新されていること
3. Contact の CTA テキストが更新されていること
4. Works の description が更新されていること
5. 全体的にメッセージが「統合価値」を伝えていること
6. 日本語と英語の使い分けが適切であること

---

## 作業完了後

1. 変更内容をユーザーに報告
2. **コミットは行わない** - ユーザーの指示を待つ
3. コピーの微調整があれば対応

---

## 参照ファイル

- `.ai/knowledge/2025-12-07-portfolio-marketing-strategy.md` - 戦略定義書
- `.claude/skills/brand-strategy/SKILL.md` - ブランド戦略
- `.claude/skills/copywriting/SKILL.md` - コピーライティング
- `.claude/skills/user-journey/SKILL.md` - ユーザージャーニー

---

## コピーライティング原則（参照）

### 使う言葉
- 一人で完結
- 統合
- 本質
- 視点
- 形にする
- 翻訳なしで

### 避ける言葉
- ワンストップ（陳腐）
- トータルソリューション（空虚）
- お客様に寄り添う（曖昧）
- 最高品質（根拠なし）
- プロフェッショナル（自称）

### トーン
- 簡潔
- 確信
- 誠実
- 知的
