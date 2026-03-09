# Photography LP リデザイン実装 — 完全ハンドオフドキュメント

> **目的:** 2026-03-09 に実施した Photography LP の全面ブラッシュアップについて、
> 別チャット / 別エージェントがそのまま改善・レビュー・追加実装を再開できるように、
> 経緯、判断、現状、前提、未解決事項をまとめた実務用ハンドオフ。
>
> **作成日:** 2026-03-09
> **ステータス:** 実装済み、`npm run build` 成功
> **関連文書:** `docs/photography-i18n-handoff.md`

---

## 1. この文書の位置づけ

- `docs/photography-i18n-handoff.md`
  - i18n 導入の全体背景、routing、locale 設計、翻訳構造、初期の Photography LP 構成をまとめた文書
- **この文書**
  - その i18n 実装後に行った **デザイン再設計の判断・差分・現在の状態** をまとめた文書

この文書だけでも実装内容は追えるが、locale 設計や next-intl の前提まで必要な場合は `photography-i18n-handoff.md` を併読すること。

---

## 2. なぜこのリデザインが必要だったか

ユーザーの問題意識は明確だった。

- 現行の Photography LP が「ノーコードツールで作ったような質感」に見える
- セクションごとの構図変化が乏しい
- すべてが中央寄せ + 単純なカード + 単純なフェードで、LP としての編集感が弱い
- 写真を売る LP なのに、写真の見せ方自体に物語や視線設計がない
- CTA が「フォームを置いただけ」に見え、商談導線としての格が足りない
- Awwwards / FWA 的な Level 4 以上の個性や記憶点がない

既存の品質基準文書でも、プロジェクト全体は `Level 3.5` 付近と位置づけられていた。

- `.claude/skills/EXCELLENCE-FRAMEWORK.md`
- `.claude/tasks/awwwards-upgrade/README.md`

今回の Photography LP 改修は、単なる UI 微調整ではなく、**Level 3 的な「整っている」状態から、Level 4 以上の「差別化された編集体験」へ引き上げる作業** として扱った。

---

## 3. 事前に確認した前提

ユーザーとの合意事項:

- 文言・情報構造の変更は許可
- 写真素材の追加・差し替えも許可
- 可能な限りデザイン性を高める
- 「Agent Teams」想定で計画を作成し、その後実装

ただし、実装時はこのセッション環境に `orchestrator-director` 相当のチーム実行ツールは存在しなかったため、**計画上はチーム分割、実作業は単独で統合実装** した。

技術的制約:

- `next-intl` ベースの i18n は維持
- 日本語デフォルト、英語は `/en/...`
- Tailwind CSS 4 + CSS カスタムプロパティ優先
- GSAP は `gsap.context(...); return () => ctx.revert();` パターン維持
- Photography Hero の WebGL フォールバックは壊さない
- フォーム送信時、select の `value` は英語固定を維持
- 新規環境変数は追加しない

---

## 4. 参照したルール / 文書

- `AGENTS.md`
- `.ai/GLOBAL.md`
- `.ai/parallel-work.md`
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md`
- `.claude/skills/EXCELLENCE-FRAMEWORK.md`
- `.claude/tasks/awwwards-upgrade/README.md`
- `docs/photography-i18n-handoff.md`

主な判断基準:

- `Pitch Black & Fire` は維持する
- テンプレ感のある中央寄せ・均質グリッド・均一 stagger を避ける
- Hero に Signature Moment を持たせる
- 各セクションに視線の役割差を作る
- 写真 LP として、画像を「並べる」のではなく「編集する」

---

## 5. リデザインのコンセプト

実装時に暗黙的に固定したコンセプトは以下。

### コンセプト名

`Tokyo Afterglow Editorial`

### 意味

- イベント直後の、まだ部屋に熱が残っている感じ
- 漆黒ベースの中にアンバーの残光がある
- ただの「撮影サービス紹介」ではなく、イベントを一本の編集物として扱う

### 具体化した方針

- Hero は左右非対称構図
- 情報は「大見出し + 補助文 + 証拠メタ情報」の 3 層
- Gallery は一様グリッドではなく `featured frames + contact sheet`
- Services はアイコンカード列挙ではなく「成果物・速度・焦点」の比較面
- Testimonial は引用だけでなくケーススタディ化
- CTA はフォーム単体ではなく「相談導線 + 入力」の二層構成

---

## 6. 実装前の LP の問題点

実コード確認で見えた問題:

- `HeroSection`
  - ほぼ中央寄せ 1 カラム
  - CTA 以外の情報層が弱い
  - 動きは `.hero-entry` の単純 stagger のみ

- `GallerySection`
  - 12 枚をほぼ均質にグリッド表示
  - featured はあるが編集意図が弱い
  - 写真のラベルや文脈がない

- `ServicesSection`
  - 3 カードを横並びしただけ
  - 内容比較しづらい
  - アイコン依存で訴求が浅い

- `TestimonialSection`
  - バッジ + 説明 + stats + quote の単一島
  - ケースとしての説得構造が薄い

- `AboutSection`
  - テキスト 1 ブロックのみ
  - CTA 前の補強として弱い

- `CTAFormSection`
  - 単一フォームカード
  - 高級感・意図・期待値設計が足りない

---

## 7. 実装した変更の全体像

### 7.1 Hero を全面再設計

変更点:

- 中央寄せ構成を廃止
- 左カラムにメインコピー、右カラムに案件要約カードを配置
- `proof strip` を追加
  - same-day preview
  - full gallery in 72h
  - bilingual communication
  - photo + highlight video
- 下部に scroll cue を追加

効果:

- Hero だけで「何をしてくれる人か」「どう速いか」「どんな案件を撮ったか」が伝わる
- LP の冒頭に編集感が出た

対象ファイル:

- `apps/web/src/features/photography/sections/HeroSection.tsx`

---

### 7.2 Hero 背景に Signature Moment を追加

既存 `VideoHeroBackground` を破壊せず拡張した。

変更点:

- `uHeat` uniform を追加
- pointer move で一時的に熱量が上がる
- scroll progress に応じて熱量が変化する
- 初回表示直後に少しだけ熱が立ち上がる
- fragment shader 側で ember 的なアンバー反応を加算

重要:

- 既存の WebGL 非対応 / 低スペック端末フォールバックは維持
- props は増やさず、内部実装だけで吸収

対象ファイル:

- `apps/web/src/features/photography/components/VideoHeroBackground.tsx`
- `apps/web/src/features/photography/shader/config.ts`
- `apps/web/src/features/photography/shader/materials.ts`

---

### 7.3 Gallery を「コンタクトシート」化

変更点:

- データ構造を `altKey + labelKey + featured` に整理
- 12 枚をそのまま等価に並べるのをやめた
- 3 枚を大きな `featured frames` として扱う
- 残りを `contact sheet` として配置
- ラベルを追加して各カットに意味付け

新しい見せ方:

- hero frames
  - Arrival light
  - Shared focus
  - Room tone
- contact sheet
  - それ以外を小さめに一覧化

Lightbox も変更:

- `GalleryImage` 型に追従
- alt を翻訳から直接引く
- ライトボックス下部にラベル表示

対象ファイル:

- `apps/web/src/features/photography/sections/GallerySection.tsx`
- `apps/web/src/features/photography/sections/LightboxDialog.tsx`

---

### 7.4 Services を「比較可能な情報面」に変更

変更点:

- 各カードに以下の3軸を持たせた
  - Deliverable
  - Timing
  - Focus
- 単なる説明文 + アイコンから脱却
- hover 時にカード全体の空気が変わる程度の控えめな演出にした

対象ファイル:

- `apps/web/src/features/photography/sections/ServicesSection.tsx`

---

### 7.5 Testimonial を Case Highlight 化

変更点:

- ラベルを `Case Highlight` に変更
- 引用だけでなく、案件背景・必要条件・結果を分解
- stats は別島にして読みやすく再配置
- quote は最終的な証言として残した

対象ファイル:

- `apps/web/src/features/photography/sections/TestimonialSection.tsx`

---

### 7.6 About を信頼補強セクションに再構成

変更点:

- 本文 1 ブロックから 3 つの補助カード付き構成に変更
- 追加した軸:
  - community literacy
  - bilingual direction
  - fast editorial finish

役割:

- CTA の直前に「なぜこの人に頼むと解像度が高いのか」を伝える

対象ファイル:

- `apps/web/src/features/photography/sections/AboutSection.tsx`

---

### 7.7 CTA を商談導線化

変更点:

- 左カラムに相談前の期待値情報
- 右カラムにフォーム本体
- 成功状態もプレーンなテキストから、継続接触を促す状態に変更
- フィールド構成自体は壊していない

維持した制約:

- hidden input `source="photography"`
- hidden input `locale`
- `select value` は英語固定
- server action は既存の `submitPhotographyInquiry` を利用

対象ファイル:

- `apps/web/src/features/photography/sections/CTAFormSection.tsx`

---

### 7.8 ページ全体の空気感を補強

`globals.css` に Photography ページ専用の軽い背景処理を追加した。

変更点:

- `.photography-page` 時のみ background を少し調整
- 固定ノイズのオーバーレイを追加
- 既存の global hero shader background は Photography では非表示のまま維持

対象ファイル:

- `apps/web/src/app/globals.css`

---

## 8. 翻訳メッセージの変更

`apps/web/messages/en.json` と `apps/web/messages/ja.json` を大きく更新した。

主な変更:

- `photography.hero.*`
  - メインコピー、proof strip、右カラム案件情報を追加
- `photography.gallery.*`
  - intro、featuredLabel、sheetLabel、sheetNote、labels.01-12 を追加
- `photography.services.*`
  - label, title, intro と各サービスの deliverable/timing/focus を追加
- `photography.testimonial.*`
  - caseTitle, outcomeTitle, outcomeBody, eventLabel, dateLabel を追加
- `photography.about.*`
  - points.communityTitle などを追加
- `photography.form.*`
  - eyebrow, aside, notes.* を追加
- `photography.metadata.*`
  - 文言を編集的な方向へ更新

注意:

- 実装途中で `next-intl` の missing key が出たため、最終的に **コンポーネント側の参照パスをメッセージ構造に合わせて修正済み**
- 現在は `build` 時に missing key は出ていない

---

## 9. 問い合わせ送信の現在仕様

Photography LP の問い合わせは Slack に送信される。

送信先:

- `SLACK_WEBHOOK_URL` 環境変数に設定された Slack Incoming Webhook

実装:

- `apps/web/src/features/photography/actions.ts`

送信される内容:

- Name
- Email
- Event Type
- Event Date
- Estimated Attendees
- Additional Details
- Locale

環境変数未設定時の挙動:

- `development`
  - Slack には送らず `console.log`
  - `success: true` を返す
- `production`
  - `submitConfig` エラーを返す

つまり、**本番運用するなら `SLACK_WEBHOOK_URL` の設定は必須**。

---

## 10. 実装時に行った探索 / 推論の流れ

大きな意思決定の流れ:

1. 既存の i18n ハンドオフ文書を読んだ
2. `HeroSection`, `GallerySection`, `ServicesSection`, `TestimonialSection`, `AboutSection`, `CTAFormSection`, `VideoHeroBackground` を読んだ
3. `.ai/GLOBAL.md`, `.ai/parallel-work.md`, `CLAUDE.md`, `EXCELLENCE-FRAMEWORK.md`, `awwwards-upgrade/README.md` を確認した
4. 現状の問題を「中央寄せ・均質グリッド・単調モーション・CTA の弱さ」と整理した
5. ユーザー意図として「文言変更も素材変更も可」が確定したため、表層修正ではなく全面再設計へ寄せた
6. Hero の記憶点は、既存 WebGL を活かした `heat response` が最も安全と判断した
7. Gallery は素材を変えずともレイアウト編集で質感を上げられるため、まず `featured + sheet` へ再構成した

---

## 11. 実装時の注意点

### 11.1 既存の作業ツリーはかなり dirty

`git status` 上、Photography LP と無関係の変更や未追跡ファイルが多数ある。

そのため今後の作業では:

- **Photography 関連ファイルだけに絞って差分確認する**
- 他作業の変更を巻き込んで revert しない
- 不要な `git add .` をしない

---

### 11.2 `messages/` は未追跡扱いになっている可能性がある

現在のワークツリーでは `apps/web/messages/` が `??` 扱いに見える状況があった。

これは:

- i18n 導入の変更がまだコミットされていない
- あるいは別作業の差分が丸ごと残っている

可能性があるため、次の担当者は **コミット単位で整理する前に git 状態を慎重に確認すること**。

---

### 11.3 Playwright による視覚確認はこのセッションでは未実施

理由:

- Playwright browser executable が未インストールで、headless 起動に失敗した

そのため今回の実装検証は主に:

- コードレビュー
- `next-intl` の missing key 解消
- `npm run build`

に依存している。

**次の担当者は、ブラウザで実画面確認を行う価値が高い。**

---

## 12. 変更ファイル一覧

今回の実装で直接変更した主要ファイル:

- `.claude/tasks/ACTIVE-PARALLEL-TASK.md`
- `apps/web/src/app/globals.css`
- `apps/web/src/features/photography/components/VideoHeroBackground.tsx`
- `apps/web/src/features/photography/shader/config.ts`
- `apps/web/src/features/photography/shader/materials.ts`
- `apps/web/src/features/photography/sections/HeroSection.tsx`
- `apps/web/src/features/photography/sections/GallerySection.tsx`
- `apps/web/src/features/photography/sections/ServicesSection.tsx`
- `apps/web/src/features/photography/sections/TestimonialSection.tsx`
- `apps/web/src/features/photography/sections/AboutSection.tsx`
- `apps/web/src/features/photography/sections/CTAFormSection.tsx`
- `apps/web/src/features/photography/sections/LightboxDialog.tsx`
- `apps/web/messages/en.json`
- `apps/web/messages/ja.json`

---

## 13. 検証結果

実施済み:

```bash
cd apps/web
npm run build
```

結果:

- build 成功
- TypeScript 成功
- 静的ページ生成成功
- `next-intl` missing key 解消済み

build 時に残る警告:

- `baseline-browser-mapping` が古い
- Next.js 16 で `middleware` は deprecated、`proxy` への移行警告が出る

これらは **今回の LP 改修起因ではない**。

---

## 14. 現在の未解決 / 追加改善候補

### 優先度 高

- ブラウザで実画面確認
  - `/photography`
  - `/en/photography`
  - スマホ幅
  - Hero の WebGL フォールバック時

- Gallery の写真選定をもう一段詰める
  - 現在は既存画像の再構成中心
  - 本当に strongest shot が featured に入っているかは人の目で再確認余地あり

- CTA の送信後導線を検討
  - 現在は成功メッセージ表示のみ
  - 追加でメール送信 / calendly / portfolio deep link を置く余地あり

### 優先度 中

- Hero の heat response をさらに洗練
  - 反応パターンはまだ安全寄り
  - より局所的で「気づく人だけ気づく」演出に寄せられる

- Scroll 全体の感情アークを強化
  - Hero → Gallery → CTA の気分の移り方は改善済み
  - ただし section 間のピーク / 解放はまだもっと設計余地がある

- Services / About のモーションに、もう少し二次的な余韻を入れる

### 優先度 低

- `middleware` → `proxy` への移行
- `baseline-browser-mapping` 更新

---

## 15. 次チャットでそのまま使える要約

以下を次のチャット冒頭に貼れば引き継ぎしやすい。

```md
Photography LP は i18n 実装後に 2026-03-09 に全面ブラッシュアップ済みです。

参照文書:
- docs/photography-i18n-handoff.md
- docs/photography-redesign-handoff.md

実装済み:
- Hero を非対称の editorial 構図へ刷新
- VideoHeroBackground に heat-response の Signature Moment 追加
- Gallery を featured frames + contact sheet に再構成
- Services / Testimonial / About / CTA を全面再設計
- en/ja メッセージを大幅更新
- npm run build は成功

前提:
- next-intl 構成は維持
- 日本語デフォルト、英語は /en
- select の value は英語固定
- 問い合わせは SLACK_WEBHOOK_URL の Slack webhook に送信

次にやる価値が高いこと:
- ブラウザで /photography と /en/photography の見た目確認
- Featured 写真の最終選定
- Hero シェーダーの熱反応の詰め
- CTA 成功後導線の改善
```

---

## 16. 最後に

この LP は、i18n 導入直後の「翻訳済みだがまだ整然としすぎている状態」から、
少なくとも「編集された一本の LP」に近づくところまでは進んでいる。

ただし、ここから先の品質差は実機確認と視覚的な微調整で決まる。
次の担当者は、コードを大きく書き換える前にまず現画面を目で見て、

- Hero の熱反応が十分に上品か
- Gallery の featured 選定が正しいか
- CTA の左カラム情報が多すぎないか
- 日本語 / 英語で行間と改行が自然か

を確認するのが最短。
