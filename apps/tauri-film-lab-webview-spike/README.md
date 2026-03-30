# Tauri + Vanilla TS

This template should help get you started developing with Tauri in vanilla HTML, CSS and Typescript.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

---

## Film Lab — WebView 能力スパイク

**目的**: macOS の WKWebView（Tauri）上で、WebGL2 / Float FBO / WebCodecs の床を Electron＋Chromium と比較する。

**前提**: [Tauri prerequisites](https://tauri.app/start/prerequisites/)（Rust、`bun`、macOS なら Xcode Command Line Tools）。

```bash
cd apps/tauri-film-lab-webview-spike
bun install
bun run tauri dev
```

**ブラウザとの差分だけ見る場合**（WebView ではない）:

```bash
bun run dev
# http://localhost:1420 を Chrome / Safari で開く
```

計測ロジックは `src/webviewCapabilityProbe.ts`。
