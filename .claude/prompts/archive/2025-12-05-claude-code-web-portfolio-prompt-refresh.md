# 2025-12-05 Claude Code 実装プロンプト（apps/web ポートフォリオ実データ化）
- Model: Claude Code (Haiku 4.5)
- Scope: `apps/web`
- 状態: PageTransition（20ブロック＋ロゴストローク）とマルチページ構造は実装済み。文言/データ/ロゴはプレースホルダ。
- 禁止: コミット、依存追加、ビルド/リンター案内、不要な大規模リファクタ。

---

## 事前にユーザーから受け取るもの
- Heroコピー（JP/EN方針）、サブコピー、タグライン（任意）
- 各ジャンル（Motion/Interactive/Installation）の案件タイトル・短文・タグ・サムネ指定（画像 or グラデ）
- Archive: 年/カテゴリリスト（配列で可）とハイライト文
- Contact: 本文、CTAラベル、メール/リンク
- SEO: metadata title/description 最終文言
- ロゴSVG: stroke/塗りのカラー想定、パス構造（単一/複数）
- Spotlight/HWに使うサムネ（画像が無い場合はグラデ指定でOK）

## 現状の差し替えポイント
- `src/features/hero/components/HeroText.tsx` — タイトル/サブコピーが固定
- `src/shared/components/Nav.tsx` — ブランド表記が `TC`
- `src/shared/transitions/Logo.tsx` — 抽象モノラインロゴ（PageTransitionで使用）
- `src/app/{motion,interactive,installation,archive,contact}/page.tsx` — 配列・文言がベタ書き
- `src/features/works/horizontal/HorizontalWorks.tsx` — `WORKS` 定数がプレースホルダ
- `src/features/works/spotlight/SpotlightGallery.tsx` — `IMAGES`/`INTRO_TEXT`/`OUTRO_TEXT` がプレースホルダ
- `src/app/layout.tsx` — metadata が仮文言
- `src/app/globals.css` — トランジション色/ロゴ色のトークン未定義

## 実装タスク
1) **ロゴ/カラー設計**
   - `apps/web/public/assets/logo/logo-mark.svg`（stroke用）と`logo-type.svg`（タイプ付き）を配置。必要なら `src/shared/assets/logo/` に複製。
   - `Logo` を外部SVGに差し替えやすい形に修正（import差し替え or propsでパス指定）。`PageTransition` から渡せるようにしてロゴが固定されないようにする。
   - `globals.css` に `--transition-overlay` `--logo-stroke` `--logo-fill` を追加（初期値は既存 `var(--bg-darker)` / `var(--text-base)` 相当）。`transition-block`/`logo-overlay`/`Logo` stroke-fill で利用。
   - z-index 9998/9999 と `pointer-events: none` の構造は維持。

2) **データ集約**
   - 新規 `src/shared/data/portfolio.ts`（名称はこれでOK）を作成。型付きオブジェクトで hero/nav/works(各カテゴリ)/horizontalWorks/spotlight/archive/contact/metadata/logo をまとめる。
   - 画像が無い場合は `{ type: "gradient", value: "linear-gradient(...)" }` などで指定できるフィールドを用意し、既存のグラデdivを再利用可能にする。
   - サンプルスキーマ（参考・実装で微調整可）:
     ```ts
     export type Media =
       | { type: "image"; src: string; alt: string }
       | { type: "gradient"; value: string };

     export interface WorkItem {
       id?: string;
       title: string;
       description: string;
       tags: string[];
       media?: Media;
     }

     export const portfolio = {
       hero: { title: { ja: "", en: "" }, subtitle: { ja: "", en: "" } },
       nav: { brand: "", links: [...] },
       motion: WorkItem[],
       interactive: WorkItem[],
       installation: WorkItem[],
       horizontalWorks: WorkItem[],
       spotlight: { intro: string; outro: string; images: Media[]; cover?: Media },
       archive: { items: { year: string; title: string; category: string }[] },
       contact: { body: string; ctaLabel: string; ctaLink: string },
       metadata: { title: string; description: string },
       logo: { mark: string; type?: string; stroke?: string; fill?: string },
     };
     ```

3) **ページ・コンポーネント差し替え**
   - `HeroText` を `portfolio.hero` 参照に変更（JP/ENのどちらを出すか方針化し、必要ならクラスで行間・サイズ調整）。
   - `Nav` のブランド表記/リンクを `portfolio.nav` から生成。内部リンクにのみ `data-transition="true"` を付与し、外部リンクは除外。
   - `layout.tsx` metadata を `portfolio.metadata` に置換。
   - `app/motion`, `app/interactive`, `app/installation`, `app/archive`, `app/contact` は `portfolio` のデータで map する。`AnimatedHeading` は維持し、英日混在時はフォントサイズ/letter-spacing を適宜調整。
   - `HorizontalWorks` の `WORKS` を `portfolio.horizontalWorks` に置換。IDや順序がデータで管理されるようにする。
   - `SpotlightGallery` の `IMAGES`/テキストを `portfolio.spotlight` から供給。画像未提供時は既存のグラデプレースホルダを継続。

4) **コピー/トークン反映**
   - 各タグ/プレースホルダの色は既存トークンを使い回す（アンバー系）。必要に応じて `--logo-stroke` `--logo-fill` を `var(--text-base)` と同値で初期化。
   - ヒーロー/セクション見出しを本人提供文言に差し替え。余白や追従アニメは変えず、クラス微調整のみで可読性を確保。

5) **挙動・安全確認**
   - トランジション対象は `data-transition="true"` の内部リンクのみ。外部リンクには付けない。
   - `splitText` の `revert` 呼び出しを壊さない（構造変更時は再確認）。
   - Pointer-events/overlayの初期値や z-index を変えない。不要なリファクタや依存追加は行わない。

## 完了条件
- 新規 `src/shared/data/portfolio.ts` へデータが集約され、各ページ/コンポーネントがそれを参照する。
- `Logo`/`PageTransition`/`Nav` がユーザー提供SVGとカラー変数で置き換え可能になっている。
- `globals.css` にロゴ/覆い色のトークンが追加され、既存カラーと同等の初期値で動作する。
- プレースホルダデータがすべて本人提供の内容に差し替わり、画像がない場合もグラデで破綻しない。
- コミットや依存追加をしていない。ビルド/リンター案内は記載しない。
