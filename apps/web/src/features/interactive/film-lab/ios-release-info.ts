/**
 * @file Filmtone iOS public-release facts shared by the web support/legal pages.
 * @description Keep public-facing limits and contact details in one place so support and privacy copy stay aligned.
 */

export const filmLabCanonicalBaseUrl = "https://www.chibatakumi.studio";

export const filmLabIosSupportEmail = "chiba@fores-tone.co.jp";
export const filmLabIosOperatorName = "Takumi Chiba";

export const filmLabIosMinimumVersion = "17.0";
export const filmLabIosSupportedDeviceFamily = "iPhone";

export const filmLabIosSourceDurationCapSeconds = 300;
export const filmLabIosSourceLongEdgeCapPx = 3840;
export const filmLabIosSourceFileSizeCapGiB = 8;

export const filmLabIosOutputLongEdgePx = 1920;
export const filmLabIosOutputFrameRate = 30;
export const filmLabIosOutputCodec = "H.264";
export const filmLabIosOutputContainer = "MP4";
export const filmLabIosPreservesSourceAudio = true;

export const filmLabIosSupportedInputCodecs = [
  "H.264 / AVC",
  "HEVC / H.265",
  "Apple ProRes",
] as const;

export const filmLabIosUnsupportedVideoCodecs = ["Avid DNxHR / DNxHD"] as const;
