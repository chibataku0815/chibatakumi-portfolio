# Filmtone Web Visual Parity Phase 1 (2026-04-01)

## 概要

Filmtone Web の `/film-lab` demo section を、Desktop の「全幅 canvas + 右フロストガラス overlay panel」へ寄せる Phase 1 を実施した。

結論として、**panel shell / layout / toolbar / i18n は前進**したが、**左 canvas の sample image が黒いまま残っており、Desktop 同等の visual parity は未達**。

このため、本タスクは「失敗」ではなく **Phase 1 完了 / Phase 2 要継続** としてアーカイブする。

## Phase 1 で改善したこと

- demo section を LP の container から breakout し、`w-screen` の全幅構造へ変更
- 右 panel を `lg:absolute` overlay に変更し、Desktop と同じ shell に近づけた
- `fl-card-muted.fl-card--frost` / toolbar / toggle chip / scroll surface を Desktop 寄せで実装
- Quick / Pro toggle の折り返しを防ぐため `min-w-[4rem]` + `whitespace-nowrap` を追加
- `film-lab.paramsPanelAria` / `closeParamsPanelAria` などの i18n 欠落を修正
- `apps/web` の `bun run build` は通過

## 未解決

### 1. 左 canvas が黒い

- `apps/web/public/images/film-lab/default.jpg` は存在し、`curl -I http://localhost:3000/images/film-lab/default.jpg` でも `200 OK`
- それでも `/film-lab` の demo section では左 pane が黒い
- 途中で fallback を試したが、設計を濁すため最終的に削除し、**sample asset 1 本を直接読む設計に戻した**

### 2. Desktop 視覚パリティは未達

- panel 側はかなり Desktop に近づいた
- しかし canvas 自体が黒いため、フロスト越しの「画像が透ける」品質検証がまだできていない

## 変更ファイル

- `apps/web/messages/ja.json`
- `apps/web/messages/en.json`
- `apps/web/src/app/globals.css`
- `apps/web/src/features/interactive/film-lab/components/FilmLabFullPage.tsx`
- `packages/film-lab-ui/src/FilmLabCanvas.tsx`
- `packages/film-lab-ui/src/FilmLabControlPanelCore.tsx`

## 検証

- `apps/web` で `bun run build` 成功
- Playwright で `/ja/film-lab` を確認
- i18n console error は解消済み
- demo section では panel は表示されるが、left canvas は黒のまま

## Phase 2 への引き継ぎ要点

1. fallback は足さない
2. `apps/web/public/images/film-lab/default.jpg` を唯一の canonical sample asset として扱う
3. `packages/film-lab-ui/src/FilmLabCanvas.tsx` の direct path で、`MediaLoader.loadURL()` の結果が本当に `viewport.setTexture()` へ届いているかを直線的に追う
4. layout/CSS は大きく触らず、まず rendering path を直す
5. sample が見えるようになってから、Desktop screenshot と panel glass の最終視覚調整を行う
