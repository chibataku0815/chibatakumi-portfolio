# Remotion Motion Lab

Remotion モーション技法の R&D テストコレクション。Filmtone 商用動画の知見蓄積が目的。

## 起動

```bash
cd apps/remotion-motion-lab
bun install
bun run dev        # Remotion Studio
```

## Phase 1 Compositions

| ID | Source | 習得技法 | Launch Video カット |
|----|--------|---------|-------------------|
| BarLineChart | #9 bar-line-chart | spring, interpolate, glow | Cut 6, 8 |
| CtaOverlay | #6 cta-overlay | ProRes alpha, slide-in, spring bounce | Cut 10 |
| ApplePromo | #10 vvterm | Apple fade-in typo, multi-scene pacing | Cut 4, 9, 10 |

## レンダー

```bash
bun run render:09   # → out/09-bar-line-chart.mp4
bun run render:06   # → out/06-cta-overlay.mov (ProRes 4444 alpha)
bun run render:10   # → out/10-apple-promo.mp4
```

## ブランドガードレール

- Spring: damping 15-25 / overshoot 5-10% / 1 回振動
- 速度: 一般テック動画より 20-30% 遅く
- 暖色のみ（クリーム〜琥珀〜焦茶）。青/ネオン禁止
- 正本: `life/.claude/knowledge/patterns/remotion-motion-lab-brand-guardrails.md`

## 追跡

- Issue: life#110
- 計画: `life/ideas/status/2026-04-04-remotion-motion-library-orchestrator-synthesis.md`
