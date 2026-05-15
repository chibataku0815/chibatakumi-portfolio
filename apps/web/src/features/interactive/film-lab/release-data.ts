export type ChangeType = "added" | "fixed" | "changed";
export type ReleasePlatform = "desktop" | "ios";

export interface ReleaseChange {
  type: ChangeType;
  key: string;
}

export interface ReleaseEntry {
  platform: ReleasePlatform;
  version: string;
  date: string;
  titleKey: string;
  changes: ReleaseChange[];
}

/**
 * Filmtone Desktop release history.
 * Newest first. Each `key` maps to an i18n key under `film-lab.releaseNotes.entries.*`.
 */
export const desktopReleases: ReleaseEntry[] = [
  {
    platform: "desktop",
    version: "1.8",
    date: "2026-05-16",
    titleKey: "v18Title",
    changes: [
      { type: "added", key: "v18SlowMode" },
      { type: "changed", key: "v18FilmBreath" },
      { type: "changed", key: "v18BlackFloorControls" },
      { type: "added", key: "v18AutomationPath" },
    ],
  },
  {
    platform: "desktop",
    version: "1.7",
    date: "2026-05-15",
    titleKey: "v17Title",
    changes: [
      { type: "fixed", key: "v17AudioExport" },
      { type: "added", key: "v17TextureSoftness" },
      { type: "changed", key: "v17SourceDetailCompensation" },
      { type: "changed", key: "v17HighlightReelAudioLimit" },
    ],
  },
  {
    platform: "desktop",
    version: "1.6",
    date: "2026-05-07",
    titleKey: "v16Title",
    changes: [
      { type: "fixed", key: "v16RightRailReach" },
      { type: "fixed", key: "v16RightRailHitDeadZone" },
      { type: "changed", key: "v16OpeningBackdrop" },
      { type: "changed", key: "v16IntensityRow" },
    ],
  },
  {
    platform: "desktop",
    version: "1.5",
    date: "2026-05-06",
    titleKey: "v15Title",
    changes: [
      { type: "changed", key: "v15PortraitVideoEditing" },
      { type: "added", key: "v15BacklightVeilIntensity" },
      { type: "changed", key: "v15LookStrength" },
      { type: "added", key: "v15HighlightReelFoundation" },
    ],
  },
  {
    platform: "desktop",
    version: "1.4",
    date: "2026-05-05",
    titleKey: "v14Title",
    changes: [
      { type: "added", key: "v14NativeDesktopCutover" },
      { type: "changed", key: "v14LiquidGlassControls" },
      { type: "added", key: "v14StillVideoExport" },
      { type: "changed", key: "v14LegacyElectronFrozen" },
    ],
  },
  {
    platform: "desktop",
    version: "1.0.4",
    date: "2026-05-02",
    titleKey: "v104Title",
    changes: [
      { type: "added", key: "v104LogConversionProfiles" },
      { type: "changed", key: "v104SourceProfileSidecars" },
      { type: "changed", key: "v104FinishingCatalog" },
      { type: "changed", key: "v104Terminology" },
    ],
  },
  {
    platform: "desktop",
    version: "1.0.3",
    date: "2026-04-24",
    titleKey: "v103Title",
    changes: [
      { type: "changed", key: "v103HdrHandling" },
      { type: "added", key: "v103BundledVideoTools" },
      { type: "changed", key: "v103PreviewExportTrust" },
      { type: "changed", key: "v103DefaultLook" },
    ],
  },
  {
    platform: "desktop",
    version: "1.0.2",
    date: "2026-04-23",
    titleKey: "v102Title",
    changes: [
      { type: "fixed", key: "v102FfmpegPipeRecovery" },
      { type: "fixed", key: "v102ExportSessionIsolation" },
      { type: "changed", key: "v102PreviewExportTrust" },
    ],
  },
  {
    platform: "desktop",
    version: "1.0.1",
    date: "2026-04-22",
    titleKey: "v101Title",
    changes: [
      { type: "changed", key: "v101HighlightPreview" },
      { type: "changed", key: "v101CrossFilterPreview" },
      { type: "added", key: "v101ExportSidecar" },
      { type: "changed", key: "v101WriteOutSurface" },
    ],
  },
  {
    platform: "desktop",
    version: "1.0.0",
    date: "2026-04-21",
    titleKey: "v100Title",
    changes: [
      { type: "added", key: "v100WebgpuPreview" },
      { type: "added", key: "v100CrossFilterPreviewControls" },
      { type: "added", key: "v100SignedNotarizedDmg" },
      { type: "changed", key: "v100DesktopFirstReleaseScope" },
    ],
  },
  {
    platform: "desktop",
    version: "0.6.2",
    date: "2026-04-09",
    titleKey: "v062Title",
    changes: [
      { type: "changed", key: "v062HardOnlySurface" },
      { type: "fixed", key: "v062StateNormalization" },
      { type: "changed", key: "v062DiscreteSpikes" },
    ],
  },
  {
    platform: "desktop",
    version: "0.6.1",
    date: "2026-04-08",
    titleKey: "v061Title",
    changes: [
      { type: "fixed", key: "v061LaunchUpdateBanner" },
      { type: "fixed", key: "v061PreviewRecoveryAfterExport" },
      { type: "changed", key: "v061GlowBlackMistRetune" },
      { type: "fixed", key: "v061HardCrossFilterSpacing" },
    ],
  },
  {
    platform: "desktop",
    version: "0.6.0",
    date: "2026-04-07",
    titleKey: "v060Title",
    changes: [
      { type: "added", key: "v060CrossFilter" },
      { type: "changed", key: "v060VideoCompareUx" },
      { type: "fixed", key: "v060ThumbnailLoadingPolish" },
      { type: "added", key: "v060PersistentProxyCache" },
    ],
  },
  {
    platform: "desktop",
    version: "0.5.1",
    date: "2026-04-06",
    titleKey: "v051Title",
    changes: [
      { type: "added", key: "v051ProgressiveLoading" },
      { type: "added", key: "v051RingBufferMotionBlur" },
      { type: "added", key: "v051PortraitVideo" },
      { type: "fixed", key: "v051ComparisonModeFix" },
    ],
  },
  {
    platform: "desktop",
    version: "0.5.0",
    date: "2026-04-06",
    titleKey: "v050Title",
    changes: [
      { type: "added", key: "v050GrainV3" },
      { type: "added", key: "v050Diffusion" },
      { type: "changed", key: "v050CineStillHalation" },
      { type: "changed", key: "v050PresetRecalibration" },
      { type: "changed", key: "v050UiReorganization" },
    ],
  },
  {
    platform: "desktop",
    version: "0.4.5",
    date: "2026-04-05",
    titleKey: "v045Title",
    changes: [
      { type: "changed", key: "v045BloomHalationRework" },
      { type: "changed", key: "v045PresetRecalibration" },
    ],
  },
  {
    platform: "desktop",
    version: "0.4.4",
    date: "2026-04-05",
    titleKey: "v044Title",
    changes: [
      { type: "fixed", key: "v044ProresLoadAndExport" },
      { type: "fixed", key: "v044Dci4kInput" },
    ],
  },
  {
    platform: "desktop",
    version: "0.4.3",
    date: "2026-04-04",
    titleKey: "v043Title",
    changes: [
      { type: "changed", key: "v043FasterHevcExport" },
      { type: "added", key: "v043AutoSourceOptimize" },
      { type: "added", key: "v043OptimizationProgress" },
    ],
  },
  {
    platform: "desktop",
    version: "0.4.2",
    date: "2026-04-03",
    titleKey: "v042Title",
    changes: [
      { type: "changed", key: "v042VideoTransport" },
      { type: "changed", key: "v042ProPanelVocabulary" },
      { type: "changed", key: "v042BloomThresholdHint" },
    ],
  },
  {
    platform: "desktop",
    version: "0.4.1",
    date: "2026-04-03",
    titleKey: "v041Title",
    changes: [
      { type: "changed", key: "v041ProToneLabels" },
      { type: "changed", key: "v041SliderTooltipReset" },
    ],
  },
  {
    platform: "desktop",
    version: "0.4.0",
    date: "2026-04-03",
    titleKey: "v040Title",
    changes: [
      { type: "added", key: "v040FilmProcess" },
      { type: "changed", key: "v040QuickProIa" },
      { type: "changed", key: "v040FilmStockPicker" },
      { type: "fixed", key: "v040PanelStability" },
      { type: "changed", key: "v040ShareCompat" },
    ],
  },
  {
    platform: "desktop",
    version: "0.3.1",
    date: "2026-04-02",
    titleKey: "v031Title",
    changes: [
      { type: "added", key: "v031WebVideoExportBeta" },
      { type: "changed", key: "v031WebBrowserReliability" },
      { type: "fixed", key: "v031FinderThumb" },
      { type: "changed", key: "v031MovHandling" },
    ],
  },
  {
    platform: "desktop",
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
    platform: "desktop",
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
    platform: "desktop",
    version: "0.1.3",
    date: "2026-03-31",
    titleKey: "v013Title",
    changes: [
      { type: "changed", key: "v013FrameLogSuppression" },
    ],
  },
  {
    platform: "desktop",
    version: "0.1.2",
    date: "2026-03-29",
    titleKey: "v012Title",
    changes: [
      { type: "fixed", key: "v012VideoColorShift" },
    ],
  },
  {
    platform: "desktop",
    version: "0.1.1",
    date: "2026-03-29",
    titleKey: "v011Title",
    changes: [
      { type: "fixed", key: "v011FfmpegPath" },
    ],
  },
  {
    platform: "desktop",
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

/**
 * Filmtone iOS public App Store release history.
 * Candidate builds such as local MARKETING_VERSION 1.3 stay in fastlane metadata until public.
 */
export const iosReleases: ReleaseEntry[] = [
  {
    platform: "ios",
    version: "1.8",
    date: "2026-05-10",
    titleKey: "iosV18Title",
    changes: [
      { type: "changed", key: "iosV18ContinuousCapture" },
      { type: "changed", key: "iosV18CaptureMonitorMode" },
      { type: "added", key: "iosV18CaptureLooks" },
      { type: "fixed", key: "iosV18CaptureStability" },
    ],
  },
  {
    platform: "ios",
    version: "1.2",
    date: "2026-04-29",
    titleKey: "iosV12Title",
    changes: [
      { type: "changed", key: "iosV12DualLutControls" },
      { type: "fixed", key: "iosV12PreviewExportColor" },
      { type: "changed", key: "iosV12HdrP3Handling" },
      { type: "fixed", key: "iosV12CacheProtection" },
    ],
  },
  {
    platform: "ios",
    version: "1.1",
    date: "2026-04-26",
    titleKey: "iosV11Title",
    changes: [
      { type: "added", key: "iosV11HdrNotice" },
      { type: "added", key: "iosV11OpticsMetadata" },
      { type: "added", key: "iosV11SidecarJson" },
      { type: "changed", key: "iosV11ProresAppleLog" },
    ],
  },
  {
    platform: "ios",
    version: "1.0",
    date: "2026-04-21",
    titleKey: "iosV10Title",
    changes: [
      { type: "added", key: "iosV10Presets" },
      { type: "added", key: "iosV10QuickControls" },
      { type: "added", key: "iosV10DualLut" },
      { type: "added", key: "iosV10ExportShare" },
    ],
  },
];

export const releases: ReleaseEntry[] = desktopReleases;

export const releaseRails: Record<ReleasePlatform, ReleaseEntry[]> = {
  desktop: desktopReleases,
  ios: iosReleases,
};
