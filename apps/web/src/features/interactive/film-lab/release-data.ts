export type ChangeType = "added" | "fixed" | "changed";

export interface ReleaseChange {
  type: ChangeType;
  key: string;
}

export interface ReleaseEntry {
  version: string;
  date: string;
  titleKey: string;
  changes: ReleaseChange[];
}

/**
 * Filmtone Desktop release history.
 * Newest first. Each `key` maps to an i18n key under `film-lab.releaseNotes.entries.*`.
 */
export const releases: ReleaseEntry[] = [
  {
    version: "0.3.0",
    date: "2026-04-01",
    titleKey: "v030Title",
    changes: [
      { type: "changed", key: "v030ExportIa" },
      { type: "fixed", key: "v030ExportSource" },
      { type: "changed", key: "v030VisualPolish" },
      { type: "added", key: "v030PresetSearch" },
      { type: "changed", key: "v030ExportBusyPause" },
      { type: "changed", key: "v030WebPreview" },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-03-31",
    titleKey: "v020Title",
    changes: [
      { type: "added", key: "v020DualLut" },
      { type: "added", key: "v020LutSync" },
      { type: "added", key: "v020InlineExportPanel" },
      { type: "changed", key: "v020WebCodecsReEnabled" },
      { type: "added", key: "v020UpdateNotify" },
      { type: "changed", key: "v020PackageRefactor" },
    ],
  },
  {
    version: "0.1.3",
    date: "2026-03-31",
    titleKey: "v013Title",
    changes: [
      { type: "changed", key: "v013FrameLogSuppression" },
    ],
  },
  {
    version: "0.1.2",
    date: "2026-03-29",
    titleKey: "v012Title",
    changes: [
      { type: "fixed", key: "v012VideoColorShift" },
    ],
  },
  {
    version: "0.1.1",
    date: "2026-03-29",
    titleKey: "v011Title",
    changes: [
      { type: "fixed", key: "v011FfmpegPath" },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-03-28",
    titleKey: "v010Title",
    changes: [
      { type: "added", key: "v010BatchExport" },
      { type: "added", key: "v010VideoExport" },
      { type: "added", key: "v010FourPresets" },
      { type: "added", key: "v010BrowserDemo" },
    ],
  },
];
