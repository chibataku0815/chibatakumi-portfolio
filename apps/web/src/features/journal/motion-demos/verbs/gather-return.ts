// Vendored — verbatim timing-clip module from motion-grammar-lab.
//   source: packages/motion-grammar/src/gather-return.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #12
//     (drawer "merge-split"/一体化と分離) — see that study's
//     validation/merge-split-construction-record.md and
//     gather-return-promotion-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The module below is pure (numbers in → numbers out) with zero imports —
//     no Remotion, no React, no DOM — safe to run in an rAF loop. Keep in sync
//     with upstream; do not re-derive the math here. Everything below this
//     header comment is byte-identical to the entire upstream file.
//
// MECHANISM (load-bearing): ONE temporal clip — gather / hold / back / rest —
// returning a progress p in [0,1]: gather = easeIn (t cubed) accelerating into
// the center, hold = 1, back = 1 − easeOutBack (overshoot past the seat, then
// settle), rest = 0. p is a plain number, so it can drive position, scale,
// opacity or rotation alike; a per-copy stagger (frame − i·step) turns the one
// clip into the whole merge-split spectacle. The sister curve makeAbsorb
// returns a "swallow level" (smoothstep in after landing × smoothstep out at
// departure) used for the mass-conserving square-root growth of the center
// disc. The spatial assembly (ring layout / stagger / parent rotation /
// center-mass) is the drawer concept and stays study-side upstream; this
// module is the part the lab promoted — the timing clip alone. The assembly is
// transcribed in ./gather-return.params.ts.

/**
 * gather-return — 「集まる → 待つ → 戻る」の汎用タイミング包絡（temporal envelope）。
 *
 * 機構: 1 周期を gather / hold / back / rest の 4 区間に割り、進行 p∈[0,1] を返す。
 *   - gather: easeIn (t³) で 0→1（集合先へ加速着地）
 *   - hold:   1 を保持（集合状態で待つ）
 *   - back:   1 − easeOutBack で 1→0（少し行き過ぎてから整定 = オーバーシュート戻り）
 *   - rest:   0（元の位置で待機）
 * p は純数値なので位置 lerp に限らず scale / opacity / 回転など任意プロパティを駆動できる。
 * 複製ごとに違うタイミングで適用するには stagger（frame − i·step）と組み合わせる。
 *
 * `makeAbsorb` は同じ timing から「吸収度」を返す姉妹包絡: 着地から window f で滑らかに 1、
 * 離脱開始から window f で 0（smoothstep の積）。質量保存の中心成長などに使う。
 *
 * 出自: studies/puttimw-motion-drawers の merge-split（一体化と分離・cell #12）verb の
 * load-bearing 機構。汎用デモ `GatherReturnGeneralityDemoCell` が別オブジェクト(四角)・別数(5)・
 * 別 stagger(5f)・別 timing で p を位置+scale+回転に流用 = 再利用単位。packages への
 * verbatim-move（数学不変・識別子改名なし）。
 */
export interface GatherReturnTiming {
  /** 集まる長さ (f) */
  gather: number;
  /** 集合先で待つ長さ (f) */
  hold: number;
  /** 戻る長さ (f) — 少し行き過ぎて整定 */
  back: number;
  /** ループ周期 (f) */
  period: number;
}

const easeIn = (t: number) => t * t * t;

// 標準 easeOutBack: 1 を ~10% 行き過ぎてから整定
const easeOutBack = (t: number) => {
  const c = 1.70158;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

const smooth = (s: number) => {
  const u = Math.min(1, Math.max(0, s));
  return u * u * (3 - 2 * u); // smoothstep
};

export const makeGatherReturn = (timing: GatherReturnTiming) => {
  const { gather, hold, back, period } = timing;
  return (frame: number): number => {
    const t = ((frame % period) + period) % period;
    if (t < gather) return easeIn(t / gather); // 集まる
    if (t < gather + hold) return 1; // 待つ
    if (t < gather + hold + back)
      return 1 - easeOutBack((t - gather - hold) / back); // 戻る
    return 0; // 元の位置
  };
};

/** 吸収度: 着地から window f で滑らかに 1、離脱開始から window f で 0 */
export const makeAbsorb = (timing: GatherReturnTiming, window = 6) => {
  const { gather, hold, period } = timing;
  return (frame: number): number => {
    const t = ((frame % period) + period) % period;
    return smooth((t - gather) / window) * (1 - smooth((t - gather - hold) / window));
  };
};
