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
| `bun run verify:vercel-settings` | Vercel の monorepo 設定確認（`VERCEL_TOKEN` 必須） |
| `bun run build:core` | Build `packages/film-lab-core` |

Details: `apps/web/README.md`.

## Vercel（prebuilt deploy via GitHub Actions）

ダッシュボードの **Root Directory** を `apps/web` にしているのは、**モノレポの公式に沿った正しい設定**です。ただし、この app は root workspace packages と `vendor/filmtone` private submodule に依存しています。

Vercel Git build は private submodule を取得できないため、`apps/web/vercel.json` で Git auto-deploy を無効化し、`.github/workflows/vercel-production-deploy.yml` から `vercel build` -> `vercel deploy --prebuilt --prod` で本番デプロイします。

Vercel 側では **Include source files outside of the Root Directory in the Build Step** も有効にする必要があります。この設定が無効、または `vendor/filmtone` submodule checkout が失敗すると、Vercel の `bun install` は `workspace:*` を解決できず次のように失敗します。

```text
error: Workspace dependency "@chibatakumi/design-system" not found
Searched in "./*"
```

設定確認:

```bash
VERCEL_TOKEN=... VERCEL_PROJECT_ID=... VERCEL_ORG_ID=... bun run verify:vercel-settings
```

API で直す場合:

```bash
curl -X PATCH "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID?teamId=$VERCEL_ORG_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory":"apps/web","sourceFilesOutsideRootDirectory":true}'
```

GitHub Actions secrets:

| Secret | Purpose |
|--------|---------|
| `FILMTONE_SUBMODULE_SSH_KEY` | `vendor/filmtone` を checkout できる read-only deploy key の private key |
| `VERCEL_TOKEN` | Vercel CLI deploy token |
| `VERCEL_ORG_ID` | Vercel team/org id |
| `VERCEL_PROJECT_ID` | `chibatakumi-portfolio-web` project id |

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
