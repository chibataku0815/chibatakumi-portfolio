/**
 * ScrollController — wheel/touch イベントから無限スクロールを制御
 *
 * 核心ロジック (akella リファレンス):
 *   wheel → rawScroll 累積
 *   floor(rawScroll) = currentSlideIndex
 *   fract(rawScroll) = transitionProgress (0-1)
 *   スクロール停止 → 最寄り整数へスナップイージング
 *
 * Three.js に依存しない純粋 TypeScript クラス。
 */

export interface ScrollControllerOptions {
  slideCount: number;
  /** wheel イベントの感度 */
  speed?: number;
  /** スナップの強さ (0-1) */
  snapStrength?: number;
  /** スナップ完了判定の閾値 */
  threshold?: number;
}

export class ScrollController {
  // --- public (debug-gui から変更可能) ---
  speed: number;
  snapStrength: number;
  threshold: number;

  // --- internal state ---
  private slideCount: number;
  private rawScroll = 0;
  private isScrolling = false;
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  // touch tracking
  private touchStartY = 0;

  // cached outputs
  private _currentIndex = 0;
  private _progress = 0;

  // bound handlers (for removeEventListener)
  private handleWheel: (e: WheelEvent) => void;
  private handleTouchStart: (e: TouchEvent) => void;
  private handleTouchMove: (e: TouchEvent) => void;
  private handleTouchEnd: () => void;

  constructor(options: ScrollControllerOptions) {
    this.slideCount = options.slideCount;
    this.speed = options.speed ?? 0.3;
    this.snapStrength = options.snapStrength ?? 0.05;
    this.threshold = options.threshold ?? 0.01;

    // --- bind handlers ---
    this.handleWheel = this.onWheel.bind(this);
    this.handleTouchStart = this.onTouchStart.bind(this);
    this.handleTouchMove = this.onTouchMove.bind(this);
    this.handleTouchEnd = this.onTouchEnd.bind(this);

    // --- register listeners (passive: false for preventDefault) ---
    window.addEventListener("wheel", this.handleWheel, { passive: false });
    window.addEventListener("touchstart", this.handleTouchStart, {
      passive: true,
    });
    window.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    window.addEventListener("touchend", this.handleTouchEnd);
  }

  // ===== Public getters =====

  /** 現在のスライドインデックス (0-based, 0 ~ slideCount-1) */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /** 遷移進行度 (0-1) */
  get progress(): number {
    return this._progress;
  }

  // ===== Core update (毎フレーム呼ぶ) =====

  update(): void {
    // スナップイージング: スクロール停止中のみ
    if (!this.isScrolling) {
      const target = Math.round(this.rawScroll);
      const delta = target - this.rawScroll;

      if (Math.abs(delta) < this.threshold) {
        this.rawScroll = target;
      } else {
        this.rawScroll += delta * this.snapStrength;
      }
    }

    // currentIndex: 負値にも対応する modulo
    const floored = Math.floor(this.rawScroll);
    this._currentIndex =
      ((floored % this.slideCount) + this.slideCount) % this.slideCount;

    // progress: rawScroll の小数部 (常に 0-1)
    this._progress = this.rawScroll - Math.floor(this.rawScroll);
  }

  // ===== Cleanup =====

  dispose(): void {
    window.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("touchstart", this.handleTouchStart);
    window.removeEventListener("touchmove", this.handleTouchMove);
    window.removeEventListener("touchend", this.handleTouchEnd);

    if (this.scrollTimeout !== null) {
      clearTimeout(this.scrollTimeout);
    }
  }

  // ===== Private: event handlers =====

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.rawScroll += (e.deltaY * this.speed) / 1000;
    this.markScrolling();
  }

  private onTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    if (!touch) return;
    this.touchStartY = touch.clientY;
    this.isScrolling = true;
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const currentY = touch.clientY;
    const deltaY = this.touchStartY - currentY;
    this.rawScroll += (deltaY * this.speed) / 1000;
    this.touchStartY = currentY;
    this.markScrolling();
  }

  private onTouchEnd(): void {
    this.markScrolling();
  }

  // ===== Private: scroll stop detection =====

  private markScrolling(): void {
    this.isScrolling = true;

    if (this.scrollTimeout !== null) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.scrollTimeout = null;
    }, 150);
  }
}
