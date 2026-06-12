# Motion-study rollout — drawer 18 技法の journal 展開計画

プッティ「モーションの引き出し」18 技法（motion-grammar-lab で construction-first
再構築 + packages API 化済み）を `/journal/motion-studies/` に 1 記事 1 技法で
展開する正本。lattice-breath（2026-06-10 公開）が型。

最終更新: 2026-06-11 / 状態: 7/18 公開（#1〜#7）

---

## 不変条件（lattice-breath で確定した型）

- **1 記事 1 技法**。kind 定義（`journal.ts`: "single motion primitive per
  article"）どおり。族横断の比較記事（echo 系 taxonomy 等）はカタログ完成後の
  別 wave とし、個別記事の素材をいま食い潰さない。
- **slug = package verb 名**（機構名）。drawer 名（ランダム/連動…）は描画結果の
  概念名なので slug に採らない — eyebrow / 本文 / callout で言及する。
- **eyebrow = 原典 drawer 名そのもの**（ja は下表「drawer」列 = 原典一枚絵の
  表記・en は平易英訳）。1 語・装飾なし。slug もタイトルも機構側を向くため、
  記事 ↔ 技法の対応は eyebrow が一目で答える（2026-06-10 ユーザー指摘:
  研究語彙の英語 eyebrow では対応が読めない）。ja/en の対応は機械ゲート
  `DRAWER_EYEBROW`（`check-motion-study-style.mjs`）が完全一致で強制。
- **記事構成 = style doc §3「組み立ての考え方が背骨」**（2026-06-11 第 3 次
  改定 — 旧 6 ビートを置換）:
  ① motion-demo block（caption = 現象 + 90 frames / 3s loop）
  ② 観察 H2 → ③ 種明かし段落
  ④ **組み立ての考え方 H2（記事のメイン）** — 配役 list + 骨格コード block
  （ドライバ 1 本 → 残りは読み替え）+ 橋渡し段落（イージングの当て方・
  ループの回し方と置き方・差し替えて遊ぶ）
  ⑤ なぜ成立するか H2 → ⑥ どうやって突き止めたか H2（反証を圧縮）
  ⑦ 末尾 callout = 帰属 + **自作仕上げパッケージの宣伝枠**
  コード規律（**値レス骨格** — 第 7 次 2026-06-12: 記事コードに具体的な数字を
  載せない・つまみは小文字裸名・実測値は vendored params とライブデモにだけ）・
  callout 規律の正本は style doc §3（ここに複製しない）
- **文体**: ジュニアエンジニア・デザイナー向けの具体先行ウォークスルー
  （2026-06-10 ユーザー承認・456c5dca + 60e0889a で lattice-breath を全面改稿
  した版が正本）。ジャーゴン排除: f 記法禁止（「10 フレーム目」「0–30
  フレーム」）・抽象語は導入時に平易定義・原典クレジットは「プッティさん」・
  「逐語移植」→「1 行ずつそのまま移植」等。`ja-writing-style.md` 準拠。
  再構築可能性監査（断定語「のみ/だけ/持たない」は実測に束縛できる場合だけ・
  タイトルは最短の現象名指し型・読者が同じものを作れるか）。
- **per-article 8 ファイルセット**:
  1. `verbs/<slug>.ts` — package 正本の vendoring（出所ヘッダ + MECHANISM
     コメント様式は lattice-breath.ts を踏襲）
  2. `verbs/<slug>.params.ts` — origin cell の実測束縛定数。**許される改変は
     3 つだけ**: 中心を demo viewBox 中心へ平行移動 / registration・AA edge bias
     等のラスタ較正アーティファクトをゼロ化 / 色を運ばない（SVG は
     currentColor、finish は API-finish light palette）。タイミング・ハンドル・
     半径比・onset は忠実に保つ
  3. `<Verb>Demo.tsx` — SVG + rAF、prefers-reduced-motion は最可読フレーム静止
  4. `finish/<slug>-source.ts` — canvas2d source painter（light palette）
  5. `<Verb>FinishDemo.tsx` — WebGPU grain+CA（fallback → SVG demo）
  6. `JournalMotionDemo.tsx` — DEMO_REGISTRY に id 追加
  7. `journal.ts` — motionStudyEntries に entry 追加（sitemap/静的生成は
     registry 駆動で自動）
  8. `messages/ja.json` + `en.json` — entries meta 4 キー + articles sections
     （eyebrow = 原典 drawer 名・上の不変条件と `DRAWER_EYEBROW` 参照）
- **正直さの拘束**: SNS 納品クリップが存在しないセルで「クリップとビット同一」
  系の主張をしない（lattice-breath の grain 文言を盲目コピーしない）。開放偏差
  （named residuals）は隠さず、1 つ選んで本文の素材にする。
- **公開ゲート**: 全ファイル uncommitted で作成 → ユーザーがローカル
  プレビュー（`bun run dev` → `/journal/motion-studies/<slug>`）→ 承認後に
  1 記事 1 コミット。**push = Actions 本番出荷**。一括 commit/push 禁止。
- **共有ファイルの編集順 = 公開スイッチを最後に**: 作業 dir は並行セッションと
  共有で、執筆途中に別記事の公開コミットが走り得る（2026-06-10、#4 執筆中の
  `journal.ts` エントリ + registry 行が #2/#3 の公開コミット cd1c9366 へ未完
  状態で混入しデプロイが割れた — bfc65a53 で修復）。記事 N は i18n sections+meta
  → verbs/params/デモコンポーネント → registry 行 → `journal.ts` エントリの順に
  書く。i18n・コンポーネントはどの途中状態で commit に巻き込まれても inert、
  registry 行とエントリだけが「点火スイッチ」なので全ファイル完成後に最後へ。

## 展開順（種明かし強度順・第 1 バッチ 5 本）

読者は順に読まないため順序はブランド第一印象の最適化のみ。反直観の強い
種明かしを先頭に。順序はバッチ境界で見直し可。

| # | slug (= package verb) | drawer | 種明かし 1 行 | 状態 |
|---|---|---|---|---|
| 1 | lattice-breath | 増減 | 個数アニメなしの創発カウント | **公開済 2026-06-10** |
| 2 | pulse-grid | ランダム | 乱数ゼロ — 「ランダム」は固定順列表 1 枚 | **公開済 2026-06-10** |
| 3 | tangency-coupled-drive | 連動 | キーフレームゼロ — 1 自由度の接触結合から全運動が幾何導出 | **公開済 2026-06-10** |
| 4 | complement-tangent-pair | 反比例 | 積保存ではなく和保存（積仮説は 95× で棄却） | **公開済 2026-06-10** |
| 5 | master-rotation-echo | 残像 | 残像 = 1 本のマスター回転の時間シフト合成 | **公開済 2026-06-11** |
| 6 | shared-hold-pulse | 対称 | 正体は共有 rise-HOLD-fall 包絡 1 本 + 符号付き振幅 | **公開済 2026-06-11** |
| 7 | whip-crawl-path-cycle | 循環 | 這いの速さはキーでなくループ閉包の残り — 鞭ベジェ 1 本 + 強制クロール | **公開済 2026-06-11** |
| 8 | coupled-shear-rotation | 分割 | 1 位相が群回転と対向シアを同時駆動 | **公開済 2026-06-12** |
| 9 | gather-return | 一体化と分離 | 昇格されたのは時間包絡だけ | |
| 10 | velocity-seeded-overshoot | 追従 | 出口速度が種・自由振幅ゼロ | |
| 11 | parallax-bob | 視差 | 共有 3 キー bob × 振幅ラダー（amp∝r 法則は棄却） | |
| 12 | arrangement-turntable | 配置移行 | 2 配置キーだけ — 渦も席替えも創発 | |
| 13 | seeded-settle-jump | 時間遅延 | | |
| 14 | offset-stagger-conveyor | オフセット | | |
| 15 | ring-dodge | 干渉 | 11f クロックパルス + 逆二乗近接場 | |
| 16 | quadrant-sign-excursion | 差 | evenodd 対称差 + union 輪郭 stroke | |
| 17 | ring-orbit-3d | 自動方向 | 3D ライブラリなしの傾いたリング二軸スピン | |
| 18 | disc-tumble-projection | 2D→3D | Three.js なしの立体化（canSkipThreeJs=YES） | |

drawer 列は原典一枚絵（drawers-grid）の表記に統一（2026-06-10 — 旧表は
シンメトリー/サイクル/分裂/集合・分散/フォロースルー/タイムディレイ/差分/
平面→立体と揺れていた）。この表記をそのまま ja eyebrow に使う。en eyebrow の
正本は `DRAWER_EYEBROW`（機械ゲート）。
種明かし空欄は執筆直前に construction record から起こす（事前の予記入をしない）。

## per-cell 正本（motion-grammar-lab）

- verb 正本: `packages/motion-grammar/src/<slug>.ts`（18 verb 全て昇格済み・
  ring-orbit-3d は `ring3d.ts` / `rotate-about-axis.ts` プリミティブ併読）
- 実測束縛定数: `studies/puttimw-motion-drawers/src/verbs/<drawer>.ts`
- 機構・反証チェーン・named residuals:
  `studies/puttimw-motion-drawers/validation/<drawer>-construction-record.md`
  + `<slug>-promotion-record.md`
- 忠実セル realization（色・AA 較正の出所確認用）:
  `studies/puttimw-motion-drawers/src/cells/<Drawer>Cell.tsx`

## SNS 連携（提案・投稿レーン管轄）

post-queue（mgl `docs/2026-06-09-sns-post-queue.md`）は承認待ちプール。
**記事が公開済みの技法から投稿する**運用にすると、投稿ごとに深掘りリンク先が
必ず存在する（image-first 戦略の深さレイヤー）。採否は投稿レーンで判断。

## 関連

- `docs/journal/curation-rationale.md` / `docs/journal/ja-writing-style.md`
- `docs/journal/wave-2-backlog.md`（非 drawer 系の既存候補リスト）
- `docs/journal/motion-demo-webgpu-finish-plan.md`（finish ライブ化の検証記録）
