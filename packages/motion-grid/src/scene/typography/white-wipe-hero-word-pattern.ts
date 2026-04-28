import {
  QUIET_HOLD_DURATION,
  buildAnchorInheritanceEvents,
  buildCarrierToneTransitionEvents,
  buildCompiledTypographyPhrase,
  collectCarrierWindowIds,
  createToneEvent,
  createHeroWordLayout,
  type CompiledBlockPlacement,
  type FinalColumnGroup,
  groupBlocksByFinalColumn,
  type CompiledTypographyPhrase,
  type StepDefinition,
  type StepEvent,
  type TypographyGridLayout,
} from "./hero-word-pattern-shared";

export const WHITE_WIPE_HERO_WORD_PATTERN_ID = "white-wipe";

function createBlinkEvent(blockId: string): StepEvent {
  return {
    type: "blink",
    blockId,
  };
}

function getColumnBoundaryPlacements(column: FinalColumnGroup): CompiledBlockPlacement[] {
  const topBlock = column.blocks[0];
  const bottomBlock = column.blocks[column.blocks.length - 1];

  if (!topBlock || !bottomBlock) {
    throw new Error("White-wipe pattern requires occupied columns.");
  }

  return topBlock.id === bottomBlock.id
    ? [topBlock]
    : [topBlock, bottomBlock];
}

function getColumnBlinkIds(column: FinalColumnGroup): string[] {
  return getColumnBoundaryPlacements(column).map((placement) => placement.id);
}

function getCarrierColumns(
  columns: readonly FinalColumnGroup[],
  startIndex: number,
  frontWidth: number,
): FinalColumnGroup[] {
  return columns.slice(startIndex, Math.min(startIndex + frontWidth, columns.length));
}

function getCarrierColumnIds(
  columns: readonly FinalColumnGroup[],
  startIndex: number,
  frontWidth: number,
): string[] {
  return collectCarrierWindowIds(
    columns,
    startIndex,
    frontWidth,
    (column) => column.blocks.map((placement) => placement.id),
  );
}

function createDuplicateEvent(
  layout: ReturnType<typeof createHeroWordLayout>,
  placement: CompiledBlockPlacement,
): StepEvent {
  return {
    type: "duplicate",
    sourceId: layout.glyphs[placement.glyphIndex]!.anchorId,
    blockId: placement.id,
    targetX: placement.finalX,
    targetY: placement.finalY,
    stackIndex: placement.stackIndex,
  };
}

export function compileWhiteWipeHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
): CompiledTypographyPhrase {
  const layout = createHeroWordLayout(grid, token);
  const leadGlyph = layout.glyphs[0];
  if (!leadGlyph) {
    throw new Error("White-wipe pattern requires at least one glyph.");
  }

  const columns = groupBlocksByFinalColumn(layout.blocks);
  const frontWidth = Math.min(3, Math.max(2, Math.floor(columns.length / 6)));
  const activeIds = new Set(layout.glyphs.map((glyph) => glyph.anchorId));

  const stepDefinitions: StepDefinition[] = [
    {
      name: "Anchor Hold",
      duration: 0.52,
      handoffRole: "hold",
      events: [],
    },
    {
      name: "Lead Blink",
      duration: 0.16,
      events: [
        createBlinkEvent(leadGlyph.anchorId),
      ],
    },
    {
      name: "Anchor Spread",
      duration: 0.18,
      handoffRole: "establish",
      events: buildAnchorInheritanceEvents(layout),
    },
  ];

  const skeletonPlacements = columns
    .flatMap((column) => getColumnBoundaryPlacements(column))
    .filter((placement) => !activeIds.has(placement.id));

  if (skeletonPlacements.length > 0) {
    stepDefinitions.push({
      name: "Column Skeleton",
      duration: 0.16,
      handoffRole: "redirect",
      events: skeletonPlacements.map((placement) => createDuplicateEvent(layout, placement)),
    });

    skeletonPlacements.forEach((placement) => {
      activeIds.add(placement.id);
    });
  }

  const initialBandIds = getCarrierColumnIds(columns, 0, frontWidth);
  const initialBand = getCarrierColumns(columns, 0, frontWidth);
  const initialLeadColumn = initialBand[initialBand.length - 1];
  if (!initialLeadColumn) {
    throw new Error("White-wipe pattern requires at least one occupied column.");
  }

  const initialEnteringPlacements = initialBand
    .flatMap((column) => column.blocks)
    .filter((placement) => !activeIds.has(placement.id));

  stepDefinitions.push({
    name: "Carrier Redirect In",
    duration: 0.10,
    handoffRole: "redirect",
    events: [
      ...initialEnteringPlacements.map((placement) => createDuplicateEvent(layout, placement)),
      ...getColumnBlinkIds(initialLeadColumn).map((blockId) => createBlinkEvent(blockId)),
      ...[
        createToneEvent(initialBandIds, "white"),
      ].filter((event): event is StepEvent => event !== null),
    ],
  });

  initialEnteringPlacements.forEach((placement) => {
    activeIds.add(placement.id);
  });

  for (let columnIndex = 1; columnIndex < columns.length; columnIndex += 1) {
    const previousBandIds = getCarrierColumnIds(columns, columnIndex - 1, frontWidth);
    const nextBandIds = getCarrierColumnIds(columns, columnIndex, frontWidth);
    const carrierColumns = getCarrierColumns(columns, columnIndex, frontWidth);
    const leadColumn = carrierColumns.at(-1);

    if (!leadColumn) {
      throw new Error("White-wipe pattern could not resolve a white front column.");
    }

    const enteringPlacements = carrierColumns
      .flatMap((column) => column.blocks)
      .filter((placement) => !activeIds.has(placement.id));

    stepDefinitions.push({
      name: `Carrier Redirect ${columnIndex + 1}`,
      duration: 0.06,
      handoffRole: "redirect",
      events: [
        ...enteringPlacements.map((placement) => createDuplicateEvent(layout, placement)),
        ...getColumnBlinkIds(leadColumn).map((blockId) => createBlinkEvent(blockId)),
        ...buildCarrierToneTransitionEvents(previousBandIds, nextBandIds),
      ],
    });

    enteringPlacements.forEach((placement) => {
      activeIds.add(placement.id);
    });
  }

  const trailingBandIds = getCarrierColumnIds(columns, Math.max(0, columns.length - 1), frontWidth);
  stepDefinitions.push({
    name: "Carrier Resolve",
    duration: 0.08,
    handoffRole: "settle",
    events: [
      createBlinkEvent(leadGlyph.anchorId),
      ...[
        createToneEvent(trailingBandIds, "dark"),
      ].filter((event): event is StepEvent => event !== null),
    ],
  });

  stepDefinitions.push(
    {
      name: "Settle",
      duration: 0.26,
      handoffRole: "settle",
      events: [
        { type: "settle" },
      ],
    },
    {
      name: "Quiet Hold",
      duration: QUIET_HOLD_DURATION,
      handoffRole: "hold-final",
      events: [],
    },
  );

  return buildCompiledTypographyPhrase(
    WHITE_WIPE_HERO_WORD_PATTERN_ID,
    layout,
    stepDefinitions,
  );
}
