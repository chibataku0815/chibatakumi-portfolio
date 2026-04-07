import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
/** ヘッドレスレンダー時の WebGL 差分を抑える（film-lab と同趣旨） */
Config.setChromiumOpenGlRenderer("angle");
