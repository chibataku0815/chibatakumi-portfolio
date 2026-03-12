# GSAP Ease 構文ガイド

> 作成: 2026-03-10 | 発見契機: Photography LP の全セクションで ease が無効だった

## 核心ルール

**GSAP は CSS の `cubic-bezier()` 構文をサポートしない。**

無効な ease 文字列を渡しても GSAP はエラーを出さず、**サイレントにデフォルト ease（`power1.out`）にフォールバック**する。意図したモーションが平坦になるが、動きはするためバグに気づきにくい。

## CSS → GSAP マッピング表

| CSS cubic-bezier | 特徴 | GSAP ease |
|-----------------|------|-----------|
| `cubic-bezier(0.22, 1, 0.36, 1)` | fast attack + gentle settle | `"expo.out"` |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | overshoot bounce | `"back.out(1.56)"` |
| `cubic-bezier(0.33, 1, 0.68, 1)` | smooth deceleration | `"power2.out"` |
| `cubic-bezier(0.25, 0.1, 0.25, 1)` | CSS ease (default) | `"power1.out"` |
| `cubic-bezier(0.42, 0, 0.58, 1)` | ease-in-out | `"power1.inOut"` |
| `cubic-bezier(0, 0, 1, 1)` | linear | `"none"` |

## GSAP Native Ease 主要パターン

| Ease | 用途 | イメージ |
|------|------|---------|
| `"power1.out"` - `"power4.out"` | 汎用減速。数字が大きいほど急減速 | カード出現、テキスト reveal |
| `"expo.out"` | 超急速スタート → 緩やかに着地 | card-settle、パネル展開 |
| `"back.out(N)"` | overshoot bounce。N でバウンス量を制御 | アイコン pop、ボタン出現 |
| `"elastic.out(1, 0.3)"` | ゴムのような振動 | 注目要素、遊び心のあるUI |
| `"bounce.out"` | 地面に跳ねるような動き | ドロップ演出 |
| `"sine.inOut"` | 自然で穏やかな往復 | breathing glow、ループアニメ |
| `"none"` | 等速（linear） | scrub 連動 |

## CustomEase（プラグイン）

GSAP Club 会員向けの `CustomEase` プラグインを使えば、任意の cubic-bezier を GSAP で使用可能:

```js
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);
CustomEase.create("myEase", "M0,0 C0.22,1 0.36,1 1,1");
gsap.to(el, { x: 100, ease: "myEase" });
```

ただし Club プラグインはライセンスが必要。**まずは native ease で代替可能か検討すること。**

## デバッグ注意点

- GSAP は無効な ease 文字列に対して **console.warn を出さない**
- Chrome DevTools の Animation パネルで実際のカーブを確認するのが確実
- GSAP DevTools（有料）を使えば ease の視覚確認が可能
- 実装時は [GSAP Ease Visualizer](https://gsap.com/docs/v3/Eases) で事前確認推奨

## このプロジェクトでの適用

| ファイル | 用途 | ease |
|---------|------|------|
| ServicesSection.tsx | card-settle 3D tilt | `"expo.out"` |
| ServicesSection.tsx | icon pop bounce | `"back.out(1.56)"` |
| AboutSection.tsx | card-settle stagger | `"expo.out"` |
| CTAFormSection.tsx | form card reveal | `"expo.out"` |
| PhotographyClient.tsx | section divider line-draw | `"power2.out"` |
