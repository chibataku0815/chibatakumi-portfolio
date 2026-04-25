import {
  QUIET_HOLD_DURATION,
  buildAnchorInheritanceEvents,
  buildCarrierToneTransitionEvents,
  buildCarrierWindowStarts,
  buildCompiledTypographyPhrase,
  collectCarrierWindowIds,
  createToneEvent,
  createHeroWordLayout,
  type CompiledBlockPlacement,
  type CompiledTypographyPhrase,
  type StepDefinition,
  type StepEvent,
  type TypographyGridLayout,
} from "./hero-word-pattern-shared";

export const SCREEN_SLAM_HERO_WORD_PATTERN_ID = "screen-slam";

interface GridCell {
  readonly x: number;
  readonly y: number;
}

interface FieldPhasePlacement {
  readonly placement: CompiledBlockPlacement;
  readonly cell: GridCell;
  readonly pathIndex: number;
}

function cellKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function buildInnerFieldCandidates(
  grid: TypographyGridLayout,
  excludedCells: readonly GridCell[],
): GridCell[] {
  const excluded = new Set(excludedCells.map((cell) => cellKey(cell.x, cell.y)));
  const candidates: GridCell[] = [];

  for (let y = 1; y < grid.rows - 1; y += 1) {
    const leftToRight = (y - 1) % 2 === 0;
    if (leftToRight) {
      for (let x = 1; x < grid.cols - 1; x += 1) {
        if (!excluded.has(cellKey(x, y))) {
          candidates.push({ x, y });
        }
      }
      continue;
    }

    for (let x = grid.cols - 2; x >= 1; x -= 1) {
      if (!excluded.has(cellKey(x, y))) {
        candidates.push({ x, y });
      }
    }
  }

  return candidates;
}

function buildFieldPhase(
  blocks: readonly CompiledBlockPlacement[],
  candidates: readonly GridCell[],
  offset: number,
  maxOffset: number,
): FieldPhasePlacement[] {
  const usableLength = candidates.length - maxOffset;
  if (usableLength < blocks.length) {
    throw new Error("Screen-slam pattern does not have enough field cells for the requested offsets.");
  }

  return blocks.map((placement, index) => {
    const baseIndex = Math.floor(((index + 0.5) * usableLength) / blocks.length);
    const pathIndex = baseIndex + offset;
    const cell = candidates[pathIndex];
    if (!cell) {
      throw new Error("Screen-slam pattern could not resolve a field phase cell.");
    }

    return {
      placement,
      cell,
      pathIndex,
    };
  });
}

function buildOrderedFieldMoveEvents(
  fromPhase: readonly FieldPhasePlacement[],
  toPhase: readonly FieldPhasePlacement[],
) {
  const fromById = new Map(fromPhase.map((entry) => [entry.placement.id, entry]));

  return [...toPhase]
    .sort((left, right) => {
      const leftFrom = fromById.get(left.placement.id);
      const rightFrom = fromById.get(right.placement.id);
      return (rightFrom?.pathIndex ?? 0) - (leftFrom?.pathIndex ?? 0);
    })
    .map((entry) => ({
      type: "move" as const,
      blockId: entry.placement.id,
      targetX: entry.cell.x,
      targetY: entry.cell.y,
      state: "screen_slam" as const,
    }));
}

function collectFieldBandIds(
  orderedBlocks: readonly FieldPhasePlacement[],
  startIndex: number,
  bandSize: number,
): string[] {
  return collectCarrierWindowIds(
    orderedBlocks,
    startIndex,
    bandSize,
    (entry) => [entry.placement.id],
  );
}

function buildReturnBands(
  orderedBlocks: readonly FieldPhasePlacement[],
  bandSize: number,
  initialBandIds: readonly string[],
): string[][] {
  const seen = new Set<string>();
  const bands: string[][] = [];

  const initialBand = initialBandIds.filter((blockId) => {
    if (seen.has(blockId)) {
      return false;
    }

    seen.add(blockId);
    return true;
  });
  if (initialBand.length > 0) {
    bands.push(initialBand);
  }

  for (let end = orderedBlocks.length; end > 0; end -= bandSize) {
    const start = Math.max(0, end - bandSize);
    const bandIds = orderedBlocks
      .slice(start, end)
      .map((entry) => entry.placement.id)
      .filter((blockId) => {
        if (seen.has(blockId)) {
          return false;
        }

        seen.add(blockId);
        return true;
      });

    if (bandIds.length > 0) {
      bands.push(bandIds);
    }
  }

  return bands;
}

export function compileScreenSlamHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
): CompiledTypographyPhrase {
  const layout = createHeroWordLayout(grid, token);
  const leadGlyph = layout.glyphs[0];
  if (!leadGlyph) {
    throw new Error("Screen-slam pattern requires at least one glyph.");
  }

  const blocks = [...layout.blocks].sort((left, right) => left.stackIndex - right.stackIndex);
  const fieldCandidates = buildInnerFieldCandidates(
    grid,
    blocks.map((placement) => ({ x: placement.finalX, y: placement.finalY })),
  );
  const phaseOffsets = [0, 6, 12, 18, 24] as const;
  const maxOffset = phaseOffsets[phaseOffsets.length - 1];
  const phases = phaseOffsets.map((offset) => buildFieldPhase(blocks, fieldCandidates, offset, maxOffset));
  const phaseZero = phases[0]!;
  const orderedPhaseZero = [...phaseZero].sort((left, right) => left.pathIndex - right.pathIndex);
  const bandSize = Math.max(8, Math.min(14, Math.floor(blocks.length * 0.22)));
  const bandStarts = buildCarrierWindowStarts(phases.length, orderedPhaseZero.length, bandSize);
  const whiteBands = bandStarts.map((startIndex) => collectFieldBandIds(orderedPhaseZero, startIndex, bandSize));

  const pulseIds = [
    phaseZero[0]?.placement.id,
    phaseZero[Math.floor(phaseZero.length * 0.2)]?.placement.id,
    phaseZero[Math.floor(phaseZero.length * 0.4)]?.placement.id,
    phaseZero[Math.floor(phaseZero.length * 0.6)]?.placement.id,
    phaseZero[Math.floor(phaseZero.length * 0.8)]?.placement.id,
    phaseZero[phaseZero.length - 1]?.placement.id,
  ].filter((blockId): blockId is string => Boolean(blockId));
  const anchorEntries = phaseZero.filter((entry) => entry.placement.isAnchor);
  const nonAnchorEntries = phaseZero.filter((entry) => !entry.placement.isAnchor);
  const initialBand = new Set(whiteBands[0] ?? []);
  const redirectBandEntries = nonAnchorEntries.filter((entry) => initialBand.has(entry.placement.id));
  const bloomEntries = nonAnchorEntries.filter((entry) => !initialBand.has(entry.placement.id));
  const finalPlacementById = new Map(blocks.map((placement) => [placement.id, placement]));
  const returnBands = buildReturnBands(
    orderedPhaseZero,
    bandSize,
    whiteBands[whiteBands.length - 1] ?? [],
  );

  const stepDefinitions: StepDefinition[] = [
    {
      name: "Anchor Hold",
      duration: 0.42,
      handoffRole: "hold",
      events: [],
    },
    {
      name: "Lead Blink",
      duration: 0.16,
      events: [
        { type: "blink", blockId: leadGlyph.anchorId },
      ],
    },
    {
      name: "Anchor Spread",
      duration: 0.18,
      handoffRole: "establish",
      events: buildAnchorInheritanceEvents(layout, blocks),
    },
    {
      name: "Carrier Redirect",
      duration: 0.18,
      handoffRole: "redirect",
      events: [
        ...anchorEntries.map((entry) => ({
          type: "move" as const,
          blockId: entry.placement.id,
          targetX: entry.cell.x,
          targetY: entry.cell.y,
          state: "screen_expand" as const,
        })),
        ...redirectBandEntries
          .map((entry) => ({
            type: "duplicate" as const,
            sourceId: layout.glyphs[entry.placement.glyphIndex]?.anchorId ?? leadGlyph.anchorId,
            blockId: entry.placement.id,
            targetX: entry.cell.x,
            targetY: entry.cell.y,
            stackIndex: entry.placement.stackIndex,
            state: "screen_expand" as const,
          })),
        ...buildCarrierToneTransitionEvents([], whiteBands[0] ?? []),
      ],
    },
    {
      name: "Grid Bloom",
      duration: 0.18,
      handoffRole: "redirect",
      events: [
        ...bloomEntries.map((entry) => ({
          type: "duplicate" as const,
          sourceId: layout.glyphs[entry.placement.glyphIndex]?.anchorId ?? leadGlyph.anchorId,
          blockId: entry.placement.id,
          targetX: entry.cell.x,
          targetY: entry.cell.y,
          stackIndex: entry.placement.stackIndex,
          state: "screen_expand" as const,
        })),
      ],
    },
  ];

  for (let index = 1; index < phases.length; index += 1) {
    stepDefinitions.push({
      name: `Field Sweep ${index}`,
      duration: 0.12,
      handoffRole: "redirect",
      events: [
        ...buildOrderedFieldMoveEvents(phases[index - 1]!, phases[index]!),
        ...buildCarrierToneTransitionEvents(whiteBands[index - 1] ?? [], whiteBands[index] ?? []),
      ],
    });
  }

  stepDefinitions.push({
    name: "Field Pulse",
    duration: 0.12,
    events: pulseIds.map((blockId) => ({
      type: "blink" as const,
      blockId,
    })),
  });

  returnBands.forEach((bandIds, index) => {
    const nextBandIds = returnBands[index + 1] ?? [];
    stepDefinitions.push({
      name: `Carrier Return ${index + 1}`,
      duration: 0.10,
      handoffRole: "settle",
      events: [
        ...bandIds.map((blockId) => {
          const placement = finalPlacementById.get(blockId);
          if (!placement) {
            throw new Error(`Screen-slam pattern could not resolve final placement for ${blockId}.`);
          }

          return {
            type: "move" as const,
            blockId,
            targetX: placement.finalX,
            targetY: placement.finalY,
            state: "screen_slam" as const,
          };
        }),
        ...buildCarrierToneTransitionEvents(bandIds, nextBandIds),
      ],
    });
  });

  stepDefinitions.push(
    {
      name: "Final Lock",
      duration: 0.12,
      handoffRole: "settle",
      events: [
        ...blocks.map((placement) => ({
          type: "move" as const,
          blockId: placement.id,
          targetX: placement.finalX,
          targetY: placement.finalY,
          state: "screen_slam" as const,
        })),
        ...[
          createToneEvent(blocks.map((placement) => placement.id), "dark"),
        ].filter((event): event is StepEvent => event !== null),
      ],
    },
    {
      name: "Settle",
      duration: 0.30,
      handoffRole: "settle",
      events: [
        { type: "settle", state: "screen_slam" },
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
    SCREEN_SLAM_HERO_WORD_PATTERN_ID,
    layout,
    stepDefinitions,
  );
}
