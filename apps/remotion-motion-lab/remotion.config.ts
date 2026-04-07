import { Config } from "@remotion/cli/config";

/**
 * Chromium の OpenGL 実装を Angle に固定します。
 *
 * 概要:
 * - `remotion still` / `remotion render` で `--gl=angle` を付けているのと同じ条件に近づけます。
 * - Remotion Studio のプレビューと、書き出した PNG / mp4 の見え方のズレを減らすためです。
 *
 * 制限事項:
 * - CLI で `--gl` を明示するとそちらが優先されます（Remotion ドキュメントどおり）。
 */
Config.setChromiumOpenGlRenderer("angle");
