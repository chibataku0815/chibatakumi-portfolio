# Stream 1 — Motion Core Library 抽出 / 引き継ぎ

| 項目 | 値 |
|---|---|
| 作成日 | 2026-04-25 |
| 前提 chat | Phase 0 IA 設計 |
| 起点 branch | `feat/renewal-2026-phase1-motion-core` |
| 起点 commit | （本書を含むコミット）|
| 親計画 | `/Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/repo-volumes-samsungportablessdx5001-do-magical-book.md` |
| 状態 | skeleton 作成済み、submodule 未追加、Agent Teams 未起動 |

---

## 0. 本書の使い方

新 chat 開始時にこの doc を最初に読み込ませる。次に Agent Teams を §6 のプロンプトで起動。

---

## 1. ゴール（Stream 1 完了の定義）

1. `webgpu-motion-libs` を独立 repo として確立し、portfolio に submodule として組み込む
2. portfolio の `packages/motion-core` から `webgpu-motion-{shell,audio,post,art}` を re-export 可能にする
3. `MotionParticipant` API を実装し、grid/flow を participant として登録できる状態にする
4. `bun install` + `bun run build` が通る
5. portfolio の demo route で grid (or flow) participant が描画される

---

## 2. 前提：webgpu-motion-* の現所在

life monorepo（`/Volumes/SamsungPortableSSDX5001/documents/life/`）の workspace packages として 8 つ存在：

| Package | 役割 |
|---|---|
| webgpu-motion-art | palette, SDF glyph |
| webgpu-motion-audio | AudioBus, defineAudioWiring |
| webgpu-motion-dom | DOM utilities |
| webgpu-motion-input | keyboard / pointer abstractions |
| webgpu-motion-post | MotionFilmPostPass, FILM_STOCK_CANON |
| webgpu-motion-scene | scene controller |
| webgpu-motion-shell | initGpu, fixed-step loop, offscreen pool |
| webgpu-motion-ui | HUD utilities |

motion-dot-new-webgpu はさらに `gpu-fx-presets`, `gpu-2.5d-presets`, `gpu-film-post` にも依存。これらも life の `output/` 配下、もしくは life root の package。

---

## 3. Submodule 戦略（推奨）

### 3.1 アプローチ — Subtree split + 新規 repo 化

```
[現状]
life/packages/webgpu-motion-{8 packages}        ← life monorepo workspace
life/output/{gpu-fx-presets, gpu-2.5d-presets}  ← 同 monorepo

[目標]
github.com/chibataku0815/webgpu-motion-libs (private or public)
└── packages/
    ├── webgpu-motion-art
    ├── webgpu-motion-audio
    ├── webgpu-motion-dom
    ├── webgpu-motion-input
    ├── webgpu-motion-post
    ├── webgpu-motion-scene
    ├── webgpu-motion-shell
    ├── webgpu-motion-ui
    ├── gpu-fx-presets
    ├── gpu-2.5d-presets
    └── gpu-film-post

[結合]
life/vendor/webgpu-motion-libs        ← submodule
portfolio/vendor/webgpu-motion-libs   ← submodule（同じ commit を参照）
```

### 3.2 実行手順（step by step）

#### Step A: 独立 repo `webgpu-motion-libs` を作成

```bash
# 新規 GitHub repo 作成（CLI または UI）
gh repo create chibataku0815/webgpu-motion-libs --private --description "Shared WebGPU motion libraries"

# ローカルで scaffold
mkdir -p ~/code/webgpu-motion-libs && cd ~/code/webgpu-motion-libs
git init
echo "node_modules\n*.log" > .gitignore
mkdir packages
cat > package.json <<EOF
{
  "name": "webgpu-motion-libs-root",
  "private": true,
  "packageManager": "bun@1.3.3",
  "workspaces": ["packages/*"]
}
EOF
git add . && git commit -m "init webgpu-motion-libs"
git remote add origin https://github.com/chibataku0815/webgpu-motion-libs.git
git push -u origin main
```

#### Step B: life から各 package を subtree split で抽出

```bash
cd /Volumes/SamsungPortableSSDX5001/documents/life

for pkg in webgpu-motion-art webgpu-motion-audio webgpu-motion-dom webgpu-motion-input webgpu-motion-post webgpu-motion-scene webgpu-motion-shell webgpu-motion-ui; do
  git subtree split --prefix=packages/$pkg -b split/$pkg
done

# gpu-fx-presets / gpu-2.5d-presets / gpu-film-post も同様（output/ 配下のため prefix が異なる）
git subtree split --prefix=output/gpu-fx-presets -b split/gpu-fx-presets
git subtree split --prefix=output/gpu-2.5d-presets -b split/gpu-2.5d-presets
git subtree split --prefix=output/gpu-film-post -b split/gpu-film-post
```

#### Step C: webgpu-motion-libs に subtree pull

```bash
cd ~/code/webgpu-motion-libs

for pkg in webgpu-motion-art webgpu-motion-audio webgpu-motion-dom webgpu-motion-input webgpu-motion-post webgpu-motion-scene webgpu-motion-shell webgpu-motion-ui gpu-fx-presets gpu-2.5d-presets gpu-film-post; do
  git remote add life-$pkg /Volumes/SamsungPortableSSDX5001/documents/life
  git subtree add --prefix=packages/$pkg life-$pkg split/$pkg
done

bun install
git push origin main
```

#### Step D: portfolio に submodule として追加

```bash
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio

git submodule add https://github.com/chibataku0815/webgpu-motion-libs.git vendor/webgpu-motion-libs

# root package.json workspaces に vendor 配下を追加
# （Edit tool で挿入。手動追加する場合は workspaces に "vendor/webgpu-motion-libs/packages/*" を追加）

bun install
```

#### Step E: life 側の対応

life monorepo は今後 `vendor/webgpu-motion-libs` 経由で同じ packages を参照する形に切り替える（破壊的変更を避けるため、life 側は **後続 chat で別途実施** — Stream 1 完了の依存ではない）。

---

## 4. 代替案（subtree が複雑な場合）

### 4.1 Plan B: ソースコピー + manual sync

各 package の `src/` を portfolio の `packages/motion-core/src/{shell,audio,post,art}/` 配下に直接コピー。  
利点: 即時動作、外部 repo 不要  
欠点: life との二重メンテ、bug fix が同期されない

### 4.2 Plan C: Bun workspace via path

life を git clone でなく **直接の filesystem パス**で workspace 参照する（`workspace:../life/packages/webgpu-motion-shell` 等）。  
利点: 即時、同期不要  
欠点: portfolio repo は単独で build できない（life ローカルパス必須、CI / Vercel デプロイで死ぬ）→ **却下**

→ **Plan A (submodule + subtree split) を推奨**。

---

## 5. 完了後に portfolio で動くべきこと

- [ ] `bun install` がエラーなく通る
- [ ] `bun run typecheck` が通る（既存 film-lab packages を破壊しない）
- [ ] `packages/motion-core/src/shell/index.ts` から `webgpu-motion-shell` を re-export して import 検証
- [ ] `packages/motion-grid/` が motion-grid-guided-webgpu のソースを vendor 経由で参照
- [ ] portfolio 内に作成した demo route（例: `/dev/motion-grid-test`）で grid scene が描画される
- [ ] `MotionParticipant` 型定義が `packages/motion-core/src/participant/index.ts` に存在し、grid/flow が implements する形になっている

---

## 6. Agent Teams 起動プロンプト（コピペ用）

新 chat 開始時、以下を投入：

```
Stream 1 を Agent Teams で起動します。

前提:
- 計画書: /Volumes/SamsungPortableSSDX5001/documents/life/.claude/plans/repo-volumes-samsungportablessdx5001-do-magical-book.md
- 引き継ぎ: chibatakumi-portfolio/docs/renewal-2026/stream-1-motion-core-handoff.md（本書）
- 現在 branch: feat/renewal-2026-phase1-motion-core
- skeleton 作成済み: packages/motion-{core,dot,grid,flow}, packages/design-system

Stream 1 の達成定義は handoff §1。submodule 戦略は §3 (Plan A) を推奨。

並列で 3 stream に分解して進めて：
1. webgpu-motion-libs 独立 repo 作成 + subtree split (handoff §3.2 Step A-C)
2. portfolio submodule 追加 + workspace 解決確認 (handoff §3.2 Step D)
3. MotionParticipant API 設計と実装 + grid/flow を participant 化 (plan §5.1 type signature)

完了基準は handoff §5。失敗時は Plan B (handoff §4.1) にフォールバック検討。
```

---

## 7. 失敗時の Fallback

- subtree split が複雑すぎる → Plan B に切替（packages/motion-core/src/ にコピー）
- bun workspace 解決エラー → `bun install --force` + `bun pm ls` で解決状況確認
- vendor 配下の path resolution エラー → `tsconfig.json` の paths 設定を確認、Next.js の transpilePackages 追加検討

---

## 8. Stream 1 完了後の次手

Stream 2 (motion-dot) → Stream 3/4/5 並列。詳細は計画書 §7-§8。

motion-dot-new-webgpu は既に WebGPU 実装が完成しているため、Stream 2 は scope が縮小（package 化 + portfolio integration、3-5 日）。
