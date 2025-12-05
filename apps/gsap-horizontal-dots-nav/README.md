# GSAP Horizontal Scroll + Staggered Text Reveal Animation

## 概要

このドキュメントは、GSAPを使用した「横スクロール＋テキストリビール」アニメーションパターンの実装ガイドです。
縦スクロールを横スクロールに変換しながら、セクションごとにテキストが「ゴースト状態（薄い）→ 実体化（濃い）」する演出を実現します。

---

## アニメーションの名称と概念

### 主要なアニメーション技法

| 名称 | 説明 |
|------|------|
| **Staggered Text Reveal** | 文字を1つずつ時間差で表示するアニメーション |
| **Ghost to Solid / Text Materialization** | 薄い（opacity: 0.03〜0.04）状態から濃い（opacity: 1）状態への変化 |
| **Horizontal Scroll Hijacking** | 縦スクロールを横スクロールに変換する手法 |
| **Pinned Section** | スクロール中にセクションを画面に固定する |
| **Scrub Animation** | スクロール位置にアニメーションを完全連動させる |

---

## 必要なライブラリ

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

---

## 実装構造

### 1. HTML構造

```html
<!-- 横スクロールラッパー -->
<div class="horizontal-wrapper">
  <div class="horizontal-container" id="horizontal">

    <!-- 各パネル（セクション） -->
    <div class="panel">
      <span class="panel-number">01</span>
      <div class="panel-content">
        <h1 class="title" data-reveal="title">タイトル</h1>
        <p class="description" data-reveal="desc">ディスクリプション...</p>
      </div>
      <div class="section-progress">
        <div class="progress-track">
          <div class="progress-fill">
            <div class="progress-head"></div>
          </div>
        </div>
        <span class="progress-text">0%</span>
      </div>
    </div>

    <!-- 追加のパネル... -->

  </div>
</div>

<!-- トランジションエフェクト用オーバーレイ -->
<div class="transition-overlay">
  <div class="transition-line" id="transitionLine"></div>
  <div class="transition-line-top" id="transitionLineTop"></div>
  <div class="transition-line-bottom" id="transitionLineBottom"></div>
  <div class="transition-flash" id="transitionFlash"></div>
</div>

<!-- セクションインジケーター（ドットナビゲーション） -->
<div class="section-indicators" id="sectionIndicators"></div>

<!-- グローバルプログレスバー -->
<div class="global-progress">
  <div class="global-progress-fill" id="globalProgress"></div>
</div>
```

### 2. 必須CSS

```css
/* 横スクロールコンテナ */
.horizontal-wrapper {
  overflow: hidden;
  position: relative;
}

.horizontal-container {
  display: flex;
  width: fit-content;
}

/* 各パネル */
.panel {
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ゴースト状態の文字 */
.title .char {
  display: inline-block;
  opacity: 0.04;  /* タイトルのゴースト状態 */
}

.description .char {
  display: inline-block;
  opacity: 0.03;  /* ディスクリプションのゴースト状態 */
}
```

---

## JavaScript実装

### 1. テキスト分割関数

```javascript
function splitToChars(element) {
  const text = element.textContent;
  element.innerHTML = '';
  return [...text].map(char => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00A0' : char;  // スペースはnbspに変換
    element.appendChild(span);
    return span;
  });
}
```

### 2. ScrollTrigger + Timeline 基本設定

```javascript
gsap.registerPlugin(ScrollTrigger);

const container = document.getElementById('horizontal');
const panels = gsap.utils.toArray('.panel');
const totalPanels = panels.length;

// スクロール距離（パネル数 × 画面高さ × 係数）
const scrollDistance = window.innerHeight * totalPanels * 2.2;

const mainTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".horizontal-wrapper",
    start: "top top",           // トリガー開始位置
    end: () => "+=" + scrollDistance,  // スクロール距離
    scrub: 1,                   // スクロール連動（数値が大きいほど滑らか）
    pin: true,                  // セクションを固定
    anticipatePin: 1,           // ピン時のガタつき防止
    onUpdate: (self) => {
      // グローバルプログレス更新
      document.getElementById('globalProgress').style.width = (self.progress * 100) + '%';
    },
    onLeave: () => {
      // 離脱時の処理
    }
  }
});
```

### 3. アニメーションフェーズ構造

各パネルのアニメーションは以下の順序で実行されます：

```javascript
panelData.forEach((data, i) => {
  const isLastPanel = i === totalPanels - 1;
  const nextData = panelData[i + 1];

  // ===== フェーズ1: タイトルアニメーション =====
  mainTimeline.to(data.titleChars, {
    opacity: 1,
    duration: 0.25,
    stagger: 0.025,      // 文字間の遅延
    ease: "power2.out",
    onStart: () => {
      // プログレスバーをアクティブに
      data.progressFill.classList.add('active');
    }
  }, i === 0 ? 0 : ">");  // 最初のパネルは0から、以降は前のアニメーション直後

  // ===== フェーズ2: ディスクリプションアニメーション =====
  mainTimeline.to(data.descChars, {
    opacity: 1,
    duration: 0.4,
    stagger: 0.004,      // タイトルより小さい = 早く表示完了
    ease: "power1.out",
    onUpdate: function() {
      // プログレスバー更新
      const completedChars = data.descChars.filter(c => parseFloat(c.style.opacity) > 0.5).length;
      const progress = Math.round((completedChars / data.descChars.length) * 100);
      data.progressFill.style.width = progress + '%';
      data.progressText.textContent = progress + '%';
    },
    onComplete: () => {
      data.progressFill.classList.add('completed');
    }
  }, "<0.12");  // タイトルアニメーション開始から0.12後に開始

  // ===== フェーズ3: セクショントランジション（最後のパネル以外）=====
  if (!isLastPanel) {

    // 現パネルのフェードアウト
    mainTimeline.to(data.panelContent, {
      scale: 0.95,
      opacity: 0.3,
      filter: "blur(4px)",
      duration: 0.12,
      ease: "power2.in"
    }, ">");  // 100%完了直後

    // トランジションライン演出
    mainTimeline.to(transitionLine, {
      width: "100%",
      opacity: 1,
      duration: 0.15,
      ease: "power2.inOut"
    }, "<0.03");

    // 横移動
    mainTimeline.to(container, {
      x: () => -(window.innerWidth * (i + 1)),
      duration: 0.2,
      ease: "power3.inOut"
    }, "<0.03");

    // ライン消去
    mainTimeline.to(transitionLine, {
      width: "0%",
      left: "100%",
      opacity: 0,
      duration: 0.15,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(transitionLine, { left: "0%" });  // リセット
      }
    }, ">-0.08");

    // 次パネルのフェードイン
    mainTimeline.set(nextData.panelContent, {
      scale: 1.05,
      opacity: 0,
      filter: "blur(4px)"
    }, "<-0.1");

    mainTimeline.to(nextData.panelContent, {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.15,
      ease: "power2.out"
    }, ">-0.08");
  }
});
```

---

## タイミング制御の重要なポイント

### 1. テキストアニメーションが完了するまで横移動しない

```javascript
// フェーズ構成
// フェーズ1: タイトル（duration: 0.25）
// フェーズ2: ディスクリプション（duration: 0.4, "<0.12"で0.12後開始）
// フェーズ3: トランジション（">"で直後に開始）

// ">" は前のアニメーション完了後を意味する
// よって100%完了まで横移動は始まらない
```

### 2. stagger値の調整

| 要素 | stagger値 | 効果 |
|------|-----------|------|
| タイトル | 0.025 | 比較的ゆっくり、文字を読ませる |
| ディスクリプション | 0.004 | 早め、長文を素早く表示完了 |

### 3. タイムライン相対位置指定

| 記法 | 意味 |
|------|------|
| `">"` | 前のアニメーション完了直後 |
| `"<"` | 前のアニメーションと同時開始 |
| `"<0.12"` | 前のアニメーション開始から0.12秒後 |
| `">-0.08"` | 前のアニメーション完了0.08秒前 |

---

## セクションナビゲーション（ドットクリック）

```javascript
function navigateToSection(index) {
  if (index < 0 || index >= totalPanels || !scrollTriggerInstance) return;

  const st = scrollTriggerInstance;
  const scrollStart = st.start;
  const scrollEnd = st.end;
  const scrollRange = scrollEnd - scrollStart;

  // セクションの開始位置を計算
  const sectionProgress = index / totalPanels;
  const targetScroll = scrollStart + (scrollRange * sectionProgress) + 5;

  // 対象セクションの状態をリセット
  resetSectionState(index);

  // スムーズスクロール
  gsap.to(window, {
    scrollTo: targetScroll,
    duration: 0.6,
    ease: "power2.inOut"
  });
}

function resetSectionState(index) {
  const data = panelDataGlobal[index];
  if (!data) return;

  // テキストをゴースト状態に戻す
  data.titleChars.forEach(char => char.style.opacity = '0.04');
  data.descChars.forEach(char => char.style.opacity = '0.03');

  // プログレスをリセット
  data.progressFill.style.width = '0%';
  data.progressFill.classList.remove('active', 'completed');
  data.progressText.textContent = '0%';
  data.wasCompleted = false;

  // パネル表示をリセット
  gsap.set(data.panelContent, {
    scale: 1,
    opacity: 1,
    filter: "blur(0px)"
  });
}
```

---

## プログレス表示の実装

### 1. セクション単位のプログレスバー

```css
.progress-fill {
  width: 0%;
  background: #fafafa;
  transition: box-shadow 0.3s ease;
}

.progress-fill.active {
  box-shadow: 0 0 8px rgba(250, 250, 250, 0.6),
              0 0 20px rgba(250, 250, 250, 0.3);
}

.progress-fill.completed {
  animation: progressFlash 0.6s ease-out;
}

/* 先端のパルスドット */
.progress-fill.active .progress-head {
  opacity: 1;
  animation: progressHeadPulse 1.2s ease-in-out infinite;
}
```

### 2. ドットインジケーター

```css
.section-dot.active {
  background: #fafafa;
  box-shadow: 0 0 12px rgba(250, 250, 250, 0.6);
}

.section-dot.active::before {
  /* 外側に広がるリングアニメーション */
  width: 24px;
  height: 24px;
  border-color: rgba(250, 250, 250, 0.4);
  animation: ringPulse 2s ease-in-out infinite;
}

.section-dot.completed::after {
  /* チェックマーク */
  content: '';
  border-left: 1.5px solid #050505;
  border-bottom: 1.5px solid #050505;
  transform: translate(-50%, -60%) rotate(-45deg);
}
```

---

## トランジションエフェクト

### セクション移動時の演出

```javascript
// 1. 現パネルのフェードアウト + スケールダウン + ブラー
mainTimeline.to(data.panelContent, {
  scale: 0.95,
  opacity: 0.3,
  filter: "blur(4px)",
  duration: 0.12,
  ease: "power2.in"
});

// 2. 水平ライン（画面中央 + 上下30%位置）
mainTimeline.to(transitionLine, {
  width: "100%",
  opacity: 1,
  duration: 0.15
});

// 3. フラッシュエフェクト
mainTimeline.to(transitionFlash, {
  opacity: 1,
  duration: 0.08
});

// 4. 横移動
mainTimeline.to(container, {
  x: () => -(window.innerWidth * (i + 1)),
  duration: 0.2,
  ease: "power3.inOut"
});

// 5. ライン消去（右へ抜ける）
mainTimeline.to(transitionLine, {
  width: "0%",
  left: "100%",
  opacity: 0,
  duration: 0.15
});

// 6. 次パネルのフェードイン + スケールアップ
mainTimeline.to(nextData.panelContent, {
  scale: 1,
  opacity: 1,
  filter: "blur(0px)",
  duration: 0.15,
  ease: "power2.out"
});
```

---

## カスタマイズポイント

### 1. アニメーション速度調整

| パラメータ | 場所 | 効果 |
|-----------|------|------|
| `scrollDistance` | `window.innerHeight * totalPanels * 2.2` | スクロール量（大きいほど遅い） |
| `scrub` | ScrollTrigger設定 | 追従の滑らかさ（1〜3推奨） |
| `stagger` | 各to()のオプション | 文字間の遅延 |
| `duration` | 各to()のオプション | アニメーション時間 |

### 2. ゴースト状態の濃さ

```css
.title .char { opacity: 0.04; }      /* より薄く: 0.02〜0.03 */
.description .char { opacity: 0.03; } /* より薄く: 0.01〜0.02 */
```

### 3. イージング

| ease | 特徴 |
|------|------|
| `power1.out` | 緩やかな減速 |
| `power2.out` | 標準的な減速 |
| `power3.inOut` | 滑らかな開始と終了 |
| `none` | 線形（スクロール連動向き） |

---

## 注意点

1. **パフォーマンス**: 文字数が多いと`splitToChars`で大量のDOMが生成される。必要に応じて単語単位に変更。

2. **リサイズ対応**: `window.innerWidth`を使用しているため、リサイズ時は`ScrollTrigger.refresh()`を呼ぶ。

3. **モバイル**: タッチスクロールの挙動が異なる場合がある。`scrub`値を調整。

4. **フォント読み込み**: Webフォント使用時は読み込み完了後に初期化する。

```javascript
document.fonts.ready.then(() => {
  initHorizontalScroll();
});
```

---

## 使用例

このパターンは以下のような場面で効果的：

- ポートフォリオサイトの作品紹介
- ブランドストーリーテリング
- 製品フィーチャー紹介
- ランディングページのヒーローセクション
- 哲学やミッションステートメントの表現

---

## 参考リンク

- [GSAP Documentation](https://gsap.com/docs/v3/)
- [ScrollTrigger Plugin](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [GSAP Timeline](https://gsap.com/docs/v3/GSAP/Timeline/)
