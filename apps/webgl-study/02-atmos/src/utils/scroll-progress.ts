/**
 * scroll-progress — GSAP ScrollTrigger ラッパー
 *
 * ネイティブスクロール + ScrollTrigger scrub でスムーズ追従。
 * progress (0-1) をコールバックで返す。
 *
 * ### なぜ scrub: 1.5 か
 * - 0.5: マウス追従が速すぎてカクカク
 * - 3.0: もっさりして操作感が悪い
 * - 1.5: Atmos のような "浮遊感" を出す最適値
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollProgressOptions {
  /** スクロール対象の trigger 要素 (CSS selector or element) */
  trigger: string | Element;
  /** scrub の遅延量（秒）。大きいほどスムーズだが遅い */
  scrub?: number;
  /** progress 更新時のコールバック */
  onUpdate: (progress: number) => void;
}

/**
 * ScrollTrigger をセットアップし、scroll progress を返す
 *
 * @returns ScrollTrigger インスタンス（dispose 用）
 */
export function setupScrollProgress(
  options: ScrollProgressOptions,
): ScrollTrigger {
  const { trigger, scrub = 1.5, onUpdate } = options;

  const st = ScrollTrigger.create({
    trigger,
    start: "top top",
    end: "bottom bottom",
    scrub,
    onUpdate: (self) => {
      onUpdate(self.progress);
    },
  });

  return st;
}

/** ScrollTrigger 全体をクリーンアップ */
export function killAllScrollTriggers(): void {
  ScrollTrigger.getAll().forEach((st) => st.kill());
}
