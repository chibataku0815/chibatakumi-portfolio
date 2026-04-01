# Filmtone Web Visual Parity を Agent Teams で回す知見

## 結論

Desktop parity 系の UI 改修は、最初から「見た目担当」だけで分けると失敗しやすい。

今回の Phase 1 では、

- layout / panel shell / i18n は前進
- しかし rendering path の切り分け前に fallback を足してしまい、論点が濁った

という学びがあった。

Agent Teams でやるなら、**見た目の stream と rendering / asset contract の stream を分ける** のがよい。

## 推奨ストリーム分割

1. Canvas Rendering
   - `FilmLabCanvas.tsx`
   - sample asset 読み込み
   - `MediaLoader` -> `viewport.setTexture()` までの直線 debug

2. Layout / Glass Panel
   - `FilmLabFullPage.tsx`
   - 全幅 breakout
   - overlay shell
   - right panel width / spacing / toggle chip

3. Panel UX / i18n
   - toolbar aria
   - Quick / Pro nowrap
   - demo section の locale 整合

4. Validation
   - `bun run build`
   - Playwright screenshot
   - console error
   - Desktop 比較の整理

## 今回の反省

- canonical asset の存在確認前に fallback を入れると、原因が隠れる
- 「黒画面」を見たら、まず path / HTTP / runtime call chain を確認すべき
- Desktop parity タスクなのに rendering と CSS を同時にいじると、どちらが原因か曖昧になる

## 次回の原則

1. asset contract を最初に固定する
2. fallback をデフォルトで入れない
3. rendering が出てから visual polish に進む
4. build success と visual success を分けて考える

## Agent Teams 用プロンプトに入れるべき一文

`fallback を足さず、canonical sample asset と direct rendering path を前提に原因を切り分けること。`

## 再利用パターン

- 「Desktop parity + WebGL preview」系では、最初の stream を CSS ではなく rendering path に置く
- overlay panel の polish は、sample image が出てから第二段で行う
- task 完了時は phase archive / phase2 handoff / agent-teams knowledge を 1 セットで残す
