# Contact Page Brushup Implementation

**日付:** 2025-12-10
**タスク:** Contact ページのブラッシュアップ（フォーム実装 + Slack連携）
**ステータス:** Completed

---

## 概要

Contact ページを静的なメールリンクから、フル機能のフォームに変更。Slack Incoming Webhooks との連携により、問い合わせ内容がリアルタイムで通知される。

---

## 実装内容

### 1. Server Action（`apps/web/src/app/contact/actions.ts`）

React 19 の Server Actions を使用したフォーム送信処理。

**特徴:**
- Zod によるバリデーション
- Slack Webhook への POST
- 開発環境では Webhook なしでも動作（console.log）

```typescript
export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState>
```

### 2. Client Component（`apps/web/src/features/contact/ContactClient.tsx`）

**フォーム機能:**
- Floating Label パターン（フォーカス時にラベルが上部へ移動）
- 下線アニメーション（フォーカス時に中央から広がる）
- Radio ボタンによる相談内容選択

**ARIGATO 成功画面:**
- 送信完了後に大文字「ARIGATO」がスタッガーアニメーションで出現
- グロー効果（text-shadow）
- チェックマークのストロークアニメーション

**送信ボタン:**
- Magnetic hover effect（マウス位置に追従）
- 回転する conic-gradient ボーダー
- 回転テキストリング（SVG textPath）
- Pulse グロー

### 3. Autocomplete スタイル修正

ブラウザのオートコンプリートで背景が白くなる問題を修正。

```css
[&:-webkit-autofill]:[-webkit-text-fill-color:var(--text-base)]
[&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]
[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_var(--bg-dark)]
```

**ポイント:**
- `-webkit-text-fill-color` でテキスト色を強制
- `transition: background-color 9999s` で背景変更を無効化
- `box-shadow: inset` で大きな影を使い背景を覆い隠す

---

## ファイル構成

```
apps/web/
├── src/
│   ├── app/contact/
│   │   ├── page.tsx          # Server Component（データ取得）
│   │   └── actions.ts        # Server Action（フォーム送信）
│   ├── features/contact/
│   │   ├── index.ts          # Export barrel
│   │   └── ContactClient.tsx # Client Component
│   └── shared/data/
│       └── portfolio.ts      # コンテンツデータ更新
├── .env.local                # Slack Webhook URL
└── .env.example              # 環境変数テンプレート
```

---

## 環境変数

```bash
# .env.local
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

---

## デザインパターン

### Floating Label Field

```tsx
const isFloating = focused || hasValue;

<label className={`
  ${isFloating
    ? "left-0 -top-6 text-xs text-[var(--accent-amber1)]"
    : "left-2 top-4 text-base text-[var(--text-base-40)]"
  }
`}>
```

### Success Animation Timeline

```typescript
const tl = gsap.timeline();

// 1. フォームコンテナをフェードアウト
tl.to(formContainerRef.current, {
  opacity: 0,
  y: -20,
  duration: 0.4,
  onComplete: () => { formContainerRef.current.style.display = "none"; },
});

// 2. 成功画面を表示
tl.set(successRef.current, { display: "flex" });

// 3. ARIGATO 文字をスタッガーで出現
tl.to(arigatoLetters, {
  opacity: 1,
  y: 0,
  scale: 1,
  filter: "blur(0px)",
  duration: 0.6,
  stagger: { each: 0.08 },
});

// 4. グロー効果
tl.to(arigatoLetters, {
  textShadow: "0 0 40px rgba(242, 184, 105, 0.8)",
  duration: 0.5,
});
```

---

## 学んだこと

### 1. React 19 useActionState

`react-hook-form` 不要で、シンプルなフォーム状態管理が可能。

```typescript
const [state, formAction, isPending] = useActionState(submitContactForm, initialState);
```

### 2. formContainerRef パターン

ヘッダーとフォームを一緒に非表示にするには、両方をラップする ref が必要。

### 3. Autocomplete との戦い

ブラウザの autofill スタイルは `!important` でも上書き困難。
`box-shadow: inset` + `transition: 9999s` のハックが効果的。

### 4. SVG textPath による回転テキスト

```html
<svg viewBox="0 0 200 200">
  <defs>
    <path id="textPath" d="M 100,100 m -80,0 a 80,80 0 1,1 160,0 a 80,80 0 1,1 -160,0" />
  </defs>
  <text>
    <textPath href="#textPath">SEND MESSAGE • GET IN TOUCH •</textPath>
  </text>
</svg>
```

---

## 関連ドキュメント

- [ARIGATO Animation](./2025-12-09-color-responsive-background.md) - Color-Responsive Background の実装
- [KNOWLEDGE.md](../.claude/tasks/awwwards-upgrade/KNOWLEDGE.md) - Phase 1/2 実装パターン

---

## 注意事項

- Slack Webhook URL は `.env.local` で管理（Git にコミットしない）
- 開発環境では `SLACK_WEBHOOK_URL` がなくてもフォームは動作する
- モバイルでは Magnetic hover effect は無効化推奨（タッチデバイスでは不自然）
