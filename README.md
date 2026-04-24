# chibatakumi-portfolio

Bun workspaces monorepo. The public site (`www.chibatakumi.studio`) lives in **`apps/web`** (Next.js 16).

## Filmtone Desktop（公開導線）

- 固定ダウンロード URL: `https://www.chibatakumi.studio/film-lab/download`
- 対応: macOS のみ / `11.0+` / Apple Silicon (`arm64`)
- 正規配布物: 署名・公証済み `DMG`
- 更新方針: 当面は手動更新（download page / release notes で差し替え）
- 窓口（Filmtone Desktop）: `chiba@fores-tone.co.jp`

> 版差分とチェックサムの正本は、各ビルドの release notes です。Desktop 版には Smart Look AI を含めません。

### Life リポ（タスク・運用・索引）

Issue やセッション横断の handoff は **別リポ（life）** に集約。実装の正は **このリポ**。短い説明のみここに置く。

- [Life リポとの役割分担](docs/guides/life-repository-connection.md)

### DMG / リリース作業

作業手順は **短縮ドキュメントのみ**参照（長文は置かない）。

- [リリース版数の正本・確認順](docs/filmtone-release-version-sources.md)
- [リリース・Blob・コマンド列](docs/guides/film-lab-desktop-release-min-decisions.md)
- [公証・1Password・`.notary.env`](docs/guides/film-lab-desktop-notarization-and-secrets.md)

## Development (`apps/web`)

From **this directory** (repository root):

```bash
bun install
bun run dev
```

This runs `next dev` with **working directory `apps/web`**, so `apps/web/.env.local` is loaded correctly.

Check cwd / `.env.local` (Filmtone donation debugging):

```bash
bun run dev:context
```

If you prefer to work inside the app:

```bash
cd apps/web
bun run dev
```

Do **not** run `next dev` from a random parent folder without passing the app root — `NEXT_PUBLIC_*` in `.env.local` will not embed.

## Other scripts

| Script | Purpose |
|--------|---------|
| `bun run build:web` | Production build of `apps/web` |
| `bun run start:web` | Start production server (after build) |
| `bun run build:core` | Build `packages/film-lab-core` |

Details: `apps/web/README.md`.

## Vercel（Root Directory = `apps/web`）

ダッシュボードの **Root Directory** を `apps/web` にしているのは、**モノレポの公式に沿った正しい設定**です。リポジトリの Git ルートはそのまま（ルートに `bun.lock` や他アプリがある）ので、「どこがアプリの入口か」を Vercel に教えるのが Root Directory の役目です。

| 作業 | 実行するディレクトリ | 理由 |
|------|----------------------|------|
| `bun run dev`（このリポのスクリプト） | **リポジトリルート**または **`cd apps/web`** | Next が `apps/web/.env.local` と `next.config.ts` を読むため |
| **`vercel deploy` / `vercel link`** | **リポジトリルート** | プロジェクトが Root Directory `apps/web` のとき、`apps/web` **から** CLI を叩くと、内部でパスが足され **`apps/web/apps/web`** のような誤パスになることがある |

ローカルで確実に揃える例:

```bash
cd /path/to/chibatakumi-portfolio   # Git のルート
bunx vercel deploy --prod --yes     # または vercel link → deploy
```

「ルートでデプロイ、アプリはサブディレクトリ」は設定ミスではなく、**モノレポ＋Vercel の普通の組み合わせ**です。気持ち悪さは **dev と CLI の cwd 規則が違う**こと由来なので、上表どおり揃えればよいです。

### Git が反応しないとき（push しても Vercel に新規デプロイが出ない）

1. **まずネイティブ連携を直す（正本）**  
   - Vercel → Project → **Settings → Git** … **Disconnect** してから同じリポジトリを **Reconnect**  
   - GitHub → リポジトリ **Settings → Webhooks** … `vercel.com` の配送エラーがないか  
   - **Production Branch** が `main` と一致しているか  

2. **バックアップ: GitHub Actions で本番デプロイ**（`.github/workflows/vercel-production-deploy.yml`）  
   GitHub リポジトリに **Actions の Secrets** を登録:

   | Secret | 入手先 |
   |--------|--------|
   | `VERCEL_TOKEN` | [Vercel Account → Tokens](https://vercel.com/account/tokens) で作成 |
   | `VERCEL_ORG_ID` | Vercel チーム設定、または手元で `vercel link` 後の `.vercel/project.json` の `orgId` |
   | `VERCEL_PROJECT_ID` | 対象プロジェクト → **Settings → General** の **Project ID**（`prj_…`） |

   `main` へ push するたびに `vercel deploy --prod` が走る。**Vercel の Git 自動デプロイも生きていると二重に走る**場合がある。そのときは連携を直したうえで、この workflow の `on.push` を無効化するかファイルを削除する。

3. **手動（CLI）** … リポジトリルートで `bunx vercel deploy --prod --yes`（`.vercel` が `chibatakumi-portfolio-web` を指していること）。
