# Photography Motion-First Refresh を Agent Teams で回す知見

## 結論

「全体感は変えず、細部の motion と section 間の空気感を上げる」タイプの UI 改修は、Agent Teams で分けるなら **構造分割ではなく責務分割** にした方がうまくいく。

## 推奨ストリーム分割

1. Motion Direction
   - 共通 easing / duration / stagger / reduced-motion 方針
   - `motion.ts` と `globals.css` の shared token を定義

2. Hero + Gallery
   - 冒頭の印象と hover の質感を担当
   - pointer drift や layered overlay など、視覚密度の主戦場

3. Mid Sections
   - Services / Case Study / About の reveal と停止位置を統一
   - 同じカードの反復に見えない差分を作る

4. CTA + Validation
   - CTA の減速感、入力 focus、成功状態
   - lint / build / banned-string search / 画面確認

## orchestrator-director 不在時の代替運用

- 実チームツールが無い環境では、`orchestrator-director 相当` の単独統括で進める
- その場合でも、最初に専門家ロールを明示し、stream 単位で設計判断を固定してから実装する
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` には「統括ロール相当」で記録すると履歴が追いやすい

## このタスクで有効だった実務順序

1. まず現状 section を全部読む
2. Shiftbrain の参照点を layout ではなく `情報密度 / hover / 余白 / case framing` に分解する
3. 共通 grammar を `motion.ts` と `globals.css` に先出しする
4. Hero と Gallery を先に仕上げる
5. 中盤セクションを同じ文法に寄せる
6. 最後に CTA と validation を締める

## 失敗しやすい点

- section ごとに easing と duration を好きに足すと、全体が「頑張っているのに雑」に見える
- hover を scale だけで済ませると、写真の密度が上がらない
- case study 化した後に copy を足しすぎると、根拠の弱い主張が再流入する
- locale route の dev 検証が不安定な場合、英語ページ実画面 + build + 翻訳整合で確認軸を分けた方が安全

## 再利用パターン

- `motion.ts` を route-local に置き、page 専用の motion grammar を持たせる
- `photography-panel` / `photography-panel-edge` / `photography-handoff` のような shared class を先に作る
- task 完了後は `.claude/tasks/archive/` に成果を落とし、同時に `.claude/knowledge/` へ再利用可能な判断だけを抽出する
