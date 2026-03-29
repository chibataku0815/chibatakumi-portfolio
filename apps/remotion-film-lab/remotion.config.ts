import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
/** WebGL 安定化（環境差は README に記載） */
Config.setChromiumOpenGlRenderer("angle");
