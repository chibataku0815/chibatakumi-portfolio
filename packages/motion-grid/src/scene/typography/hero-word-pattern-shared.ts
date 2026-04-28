import type { BlockState, BlockTone, DiscreteEvent, PhraseStep } from "../discrete-grid-scene";
import {
  GLYPH_SPACING,
  GLYPH_WIDTH,
  resolveHeroTokenSpec,
  type GridGlyphDefinition,
} from "./hero-token";

export interface GlyphCell {
  readonly x: number;
  readonly y: number;
}

export type HandoffRole = "hold" | "establish" | "redirect" | "settle" | "hold-final" | "accent";

export type StepEvent =
  | {
      readonly type: "blink";
      readonly blockId: string;
    }
  | {
      readonly type: "duplicate";
      readonly sourceId: string;
      readonly blockId: string;
      readonly targetX: number;
      readonly targetY: number;
      readonly stackIndex: number;
      readonly state?: Exclude<BlockState, "idle">;
    }
  | {
      readonly type: "move";
      readonly blockId: string;
      readonly targetX: number;
      readonly targetY: number;
      readonly stackIndex?: number;
      readonly state?: Exclude<BlockState, "idle">;
    }
  | {
      readonly type: "settle";
      readonly blockIds?: readonly string[];
      readonly state?: Exclude<BlockState, "idle">;
    }
  | {
      readonly type: "tone";
      readonly blockIds: readonly string[];
      readonly tone: BlockTone;
    }
  | {
      readonly type: "visibility";
      readonly blockIds: readonly string[];
      readonly visible: boolean;
    }
  | {
      readonly type: "ticker_scroll";
      readonly blockIds: readonly string[];
      readonly startOffset: number;
      readonly endOffset: number;
      readonly startOffsetY?: number;
      readonly endOffsetY?: number;
      readonly perBlockDelays?: ReadonlyMap<string, number>;
      readonly perBlockDuration?: number;
      readonly state?: Exclude<BlockState, "idle">;
    };

export interface StepDefinition {
  readonly name: string;
  readonly duration: number;
  readonly events: readonly StepEvent[];
  readonly handoffRole?: HandoffRole;
}

export interface TypographyGridLayout {
  readonly cols: number;
  readonly rows: number;
  readonly glyphSpacing?: number;
}

export interface CompiledBlockPlacement {
  readonly id: string;
  readonly glyphIndex: number;
  readonly finalX: number;
  readonly finalY: number;
  readonly spawnX: number;
  readonly spawnY: number;
  readonly stackIndex: number;
  readonly isAnchor: boolean;
  readonly isTerminal: boolean;
}

export interface CompiledGlyphPlacement {
  readonly char: string;
  readonly index: number;
  readonly anchorId: string;
  readonly sourceId: string;
  readonly terminalId: string;
  readonly blockIds: readonly string[];
}

export interface CompiledTypographyPhrase {
  readonly patternId: string;
  readonly token: string;
  readonly leadAnchorId: string;
  readonly blocks: readonly CompiledBlockPlacement[];
  readonly glyphs: readonly CompiledGlyphPlacement[];
  readonly steps: readonly PhraseStep[];
}

export interface HeroWordLayout {
  readonly token: string;
  readonly blocks: readonly CompiledBlockPlacement[];
  readonly glyphs: readonly CompiledGlyphPlacement[];
}

export interface GlyphBoundaryPartition {
  readonly outlineBlocks: readonly CompiledBlockPlacement[];
  readonly interiorBlocks: readonly CompiledBlockPlacement[];
}

export interface FinalColumnGroup {
  readonly columnX: number;
  readonly blocks: readonly CompiledBlockPlacement[];
}

export interface SimulatedPhraseBlockState {
  readonly id: string;
  x: number;
  y: number;
  stackIndex: number;
  tone: BlockTone;
  visible: boolean;
}

export interface SimulatedPhraseState {
  readonly blocks: ReadonlyMap<string, SimulatedPhraseBlockState>;
  readonly visibleIds: readonly string[];
}

export interface PatternHandoffBridge {
  readonly steps: readonly PhraseStep[];
  readonly targetEstablishStep: PhraseStep;
  readonly rewrittenTargetCompiled?: CompiledTypographyPhrase;
}

export const QUIET_HOLD_DURATION = 0.54;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function extractGlyphCells(glyph: GridGlyphDefinition): GlyphCell[] {
  const cells: GlyphCell[] = [];

  glyph.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "1") {
        cells.push({ x, y });
      }
    }
  });

  return cells;
}

export function chooseAnchorCell(cells: readonly GlyphCell[]): GlyphCell {
  const [anchor] = cells;
  if (!anchor) {
    throw new Error("Glyph has no occupied cells.");
  }
  return anchor;
}

export function chooseTerminalCell(
  cells: readonly GlyphCell[],
  anchor: GlyphCell,
): GlyphCell {
  const candidates = [...cells].sort((left, right) => (
    right.y - left.y || right.x - left.x
  ));

  return candidates.find((cell) => cell.x !== anchor.x || cell.y !== anchor.y)
    ?? anchor;
}

export function buildPhraseSteps(definitions: readonly StepDefinition[]): PhraseStep[] {
  let cursor = 0;

  return definitions.map((definition, index) => {
    const startTime = cursor;
    const endTime = startTime + definition.duration;
    cursor = endTime;

    return {
      index,
      name: definition.name,
      startTime,
      endTime,
      duration: definition.duration,
      handoffRole: definition.handoffRole,
      events: definition.events.map((event): DiscreteEvent => ({ ...event, at: startTime })),
    };
  });
}

export function createHeroWordLayout(
  grid: TypographyGridLayout,
  token: string,
): HeroWordLayout {
  const glyphSpacing = grid.glyphSpacing ?? GLYPH_SPACING;
  const tokenSpec = resolveHeroTokenSpec(token, glyphSpacing);
  const startX = clamp(
    Math.floor((grid.cols - tokenSpec.width) * 0.5),
    1,
    Math.max(1, grid.cols - tokenSpec.width - 1),
  );
  const startY = clamp(
    Math.floor((grid.rows - tokenSpec.height) * 0.5),
    1,
    Math.max(1, grid.rows - tokenSpec.height - 2),
  );

  const compiledGlyphs: CompiledGlyphPlacement[] = [];
  const compiledBlocks: CompiledBlockPlacement[] = [];
  let cursorX = startX;
  let stackIndex = 0;

  tokenSpec.glyphs.forEach((glyph, glyphIndex) => {
    const cells = extractGlyphCells(glyph);
    if (cells.length === 0) {
      cursorX += GLYPH_WIDTH + glyphSpacing;
      return;
    }

    const anchorCell = chooseAnchorCell(cells);
    const terminalCell = chooseTerminalCell(cells, anchorCell);
    const blockIds: string[] = [];

    cells.forEach((cell) => {
      const finalX = cursorX + cell.x;
      const finalY = startY + cell.y;
      const isAnchor = cell.x === anchorCell.x && cell.y === anchorCell.y;
      const isTerminal = cell.x === terminalCell.x && cell.y === terminalCell.y;
      const id = `glyph-${glyphIndex}-${glyph.char}-${cell.x}-${cell.y}`;

      compiledBlocks.push({
        id,
        glyphIndex,
        finalX,
        finalY,
        spawnX: finalX,
        spawnY: finalY,
        stackIndex,
        isAnchor,
        isTerminal,
      });
      blockIds.push(id);
      stackIndex += 1;
    });

    const anchorId = compiledBlocks.find((placement) => (
      placement.glyphIndex === glyphIndex && placement.isAnchor
    ))?.id;
    const terminalId = compiledBlocks.find((placement) => (
      placement.glyphIndex === glyphIndex && placement.isTerminal
    ))?.id;

    if (!anchorId || !terminalId) {
      throw new Error(`Failed to compile glyph ${glyph.char}.`);
    }

    compiledGlyphs.push({
      char: glyph.char,
      index: glyphIndex,
      anchorId,
      sourceId: glyphIndex === 0 ? anchorId : compiledGlyphs[glyphIndex - 1]!.anchorId,
      terminalId,
      blockIds,
    });

    cursorX += GLYPH_WIDTH + glyphSpacing;
  });

  if (compiledGlyphs.length === 0) {
    throw new Error("Hero token compiled to an empty word.");
  }

  return {
    token: tokenSpec.token,
    blocks: compiledBlocks,
    glyphs: compiledGlyphs,
  };
}

export function buildCompiledTypographyPhrase(
  patternId: string,
  layout: HeroWordLayout,
  stepDefinitions: readonly StepDefinition[],
  options?: {
    readonly blocks?: readonly CompiledBlockPlacement[];
    readonly leadAnchorId?: string;
  },
): CompiledTypographyPhrase {
  const leadAnchorId = options?.leadAnchorId ?? layout.glyphs[0]?.anchorId;
  if (!leadAnchorId) {
    throw new Error("Typography pattern requires a lead anchor.");
  }

  return {
    patternId,
    token: layout.token,
    leadAnchorId,
    blocks: options?.blocks ?? layout.blocks,
    glyphs: layout.glyphs,
    steps: buildPhraseSteps(stepDefinitions),
  };
}

export function findFirstStepByHandoffRole(
  compiled: CompiledTypographyPhrase,
  handoffRole: HandoffRole,
): PhraseStep | undefined {
  return compiled.steps.find((step) => step.handoffRole === handoffRole);
}

function uniqueBlockIds(blockIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  blockIds.forEach((blockId) => {
    if (seen.has(blockId)) {
      return;
    }

    seen.add(blockId);
    unique.push(blockId);
  });

  return unique;
}

export function createToneEvent(blockIds: readonly string[], tone: BlockTone): StepEvent | null {
  const uniqueIds = uniqueBlockIds(blockIds);
  if (uniqueIds.length === 0) {
    return null;
  }

  return {
    type: "tone",
    blockIds: uniqueIds,
    tone,
  };
}

export function createVisibilityEvent(
  blockIds: readonly string[],
  visible: boolean,
): StepEvent | null {
  const uniqueIds = uniqueBlockIds(blockIds);
  if (uniqueIds.length === 0) {
    return null;
  }

  return {
    type: "visibility",
    blockIds: uniqueIds,
    visible,
  };
}

function setVisibleIds(
  state: ReadonlyMap<string, SimulatedPhraseBlockState>,
): readonly string[] {
  return [...state.values()]
    .filter((block) => block.visible)
    .sort((left, right) => left.stackIndex - right.stackIndex || left.id.localeCompare(right.id))
    .map((block) => block.id);
}

export function simulateCompiledPhraseToStep(
  compiled: CompiledTypographyPhrase,
  throughStepIndex: number,
): SimulatedPhraseState {
  const leadPlacement = getBlockById(compiled.blocks, compiled.leadAnchorId);
  const activeBlocks = new Map<string, SimulatedPhraseBlockState>([
    [
      leadPlacement.id,
      {
        id: leadPlacement.id,
        x: leadPlacement.finalX,
        y: leadPlacement.finalY,
        stackIndex: leadPlacement.stackIndex,
        tone: "dark",
        visible: true,
      },
    ],
  ]);

  const getStateBlock = (blockId: string): SimulatedPhraseBlockState => {
    const block = activeBlocks.get(blockId);
    if (!block) {
      throw new Error(`${compiled.patternId}: missing simulated block ${blockId}.`);
    }
    return block;
  };

  const stepLimit = Math.min(throughStepIndex, compiled.steps.length - 1);
  if (stepLimit < 0) {
    return {
      blocks: activeBlocks,
      visibleIds: setVisibleIds(activeBlocks),
    };
  }

  compiled.steps.slice(0, stepLimit + 1).forEach((step) => {
    step.events.forEach((event) => {
      if (event.type === "blink" || event.type === "settle" || event.type === "ticker_scroll") {
        return;
      }

      if (event.type === "duplicate") {
        const source = getStateBlock(event.sourceId);
        const existing = activeBlocks.get(event.blockId);
        if (existing) {
          existing.x = event.targetX;
          existing.y = event.targetY;
          existing.stackIndex = event.stackIndex;
          existing.tone = "dark";
          existing.visible = true;
          return;
        }

        activeBlocks.set(event.blockId, {
          id: event.blockId,
          x: event.targetX,
          y: event.targetY,
          stackIndex: event.stackIndex,
          tone: source.tone,
          visible: true,
        });
        return;
      }

      if (event.type === "move") {
        const block = getStateBlock(event.blockId);
        block.x = event.targetX;
        block.y = event.targetY;
        if (typeof event.stackIndex === "number") {
          block.stackIndex = event.stackIndex;
        }
        return;
      }

      if (event.type === "tone") {
        event.blockIds.forEach((blockId) => {
          getStateBlock(blockId).tone = event.tone;
        });
        return;
      }

      event.blockIds.forEach((blockId) => {
        getStateBlock(blockId).visible = event.visible;
      });
    });
  });

  return {
    blocks: activeBlocks,
    visibleIds: setVisibleIds(activeBlocks),
  };
}

export function buildAnchorInheritanceEvents(
  layout: HeroWordLayout,
  blocks: readonly CompiledBlockPlacement[] = layout.blocks,
): StepEvent[] {
  return layout.glyphs.slice(1).map((glyph) => {
    const sourceGlyph = layout.glyphs[glyph.index - 1]!;
    const anchorBlock = getBlockById(blocks, glyph.anchorId);

    return {
      type: "duplicate" as const,
      sourceId: sourceGlyph.anchorId,
      blockId: glyph.anchorId,
      targetX: anchorBlock.finalX,
      targetY: anchorBlock.finalY,
      stackIndex: anchorBlock.stackIndex,
    };
  });
}

export function buildCarrierWindowStarts(
  windowCount: number,
  orderedLength: number,
  windowSize: number,
): number[] {
  if (windowCount <= 0 || orderedLength <= 0 || windowSize <= 0) {
    return [];
  }

  const maxStart = Math.max(orderedLength - windowSize, 0);
  if (windowCount === 1) {
    return [0];
  }

  return Array.from({ length: windowCount }, (_, index) => (
    Math.floor((index * maxStart) / (windowCount - 1))
  ));
}

export function collectCarrierWindowIds<T>(
  orderedItems: readonly T[],
  startIndex: number,
  windowSize: number,
  resolveIds: (item: T) => readonly string[],
): string[] {
  return uniqueBlockIds(
    orderedItems
      .slice(startIndex, Math.min(startIndex + windowSize, orderedItems.length))
      .flatMap(resolveIds),
  );
}

export function buildCarrierToneTransitionEvents(
  previousBandIds: readonly string[],
  nextBandIds: readonly string[],
): StepEvent[] {
  const nextBand = new Set(nextBandIds);
  const previousBand = new Set(previousBandIds);
  const leavingIds = previousBandIds.filter((blockId) => !nextBand.has(blockId));
  const enteringIds = nextBandIds.filter((blockId) => !previousBand.has(blockId));

  return [
    createToneEvent(leavingIds, "dark"),
    createToneEvent(enteringIds, "white"),
  ].filter((event): event is StepEvent => event !== null);
}

interface SimulatedCellPlacement {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly stackIndex: number;
}

interface WordBlockMatchResult {
  readonly matched: ReadonlyMap<string, string>;
  readonly surplus: readonly SimulatedCellPlacement[];
  readonly deficit: readonly SimulatedCellPlacement[];
}

function toSimulatedCellPlacements(
  state: SimulatedPhraseState,
): SimulatedCellPlacement[] {
  return state.visibleIds.map((blockId) => {
    const block = state.blocks.get(blockId);
    if (!block) {
      throw new Error(`Missing simulated block ${blockId} in word-handoff state.`);
    }
    return {
      id: blockId,
      x: block.x,
      y: block.y,
      stackIndex: block.stackIndex,
    };
  });
}

function matchBlocksByPosition(
  sources: readonly SimulatedCellPlacement[],
  targets: readonly SimulatedCellPlacement[],
): WordBlockMatchResult {
  const matched = new Map<string, string>();
  const usedSourceIds = new Set<string>();
  const deficit: SimulatedCellPlacement[] = [];
  const sortedTargets = [...targets].sort((left, right) => (
    left.x - right.x || left.y - right.y || left.stackIndex - right.stackIndex
  ));

  const coincidentByCell = new Map<string, SimulatedCellPlacement[]>();
  sources.forEach((source) => {
    const key = `${source.x}:${source.y}`;
    const bucket = coincidentByCell.get(key);
    if (bucket) {
      bucket.push(source);
      return;
    }
    coincidentByCell.set(key, [source]);
  });

  sortedTargets.forEach((target) => {
    const coincident = coincidentByCell.get(`${target.x}:${target.y}`) ?? [];
    const coincidentCandidate = coincident.find((candidate) => !usedSourceIds.has(candidate.id));
    if (coincidentCandidate) {
      matched.set(coincidentCandidate.id, target.id);
      usedSourceIds.add(coincidentCandidate.id);
      return;
    }

    let bestSource: SimulatedCellPlacement | undefined;
    let bestScore = Number.POSITIVE_INFINITY;
    sources.forEach((source) => {
      if (usedSourceIds.has(source.id)) {
        return;
      }
      const score = Math.abs(source.x - target.x) * 100
        + Math.abs(source.y - target.y)
        + Math.abs(source.stackIndex - target.stackIndex) * 0.01;
      if (score < bestScore) {
        bestScore = score;
        bestSource = source;
      }
    });

    if (bestSource) {
      matched.set(bestSource.id, target.id);
      usedSourceIds.add(bestSource.id);
      return;
    }

    deficit.push(target);
  });

  const surplus = sources.filter((source) => !usedSourceIds.has(source.id));

  return { matched, surplus, deficit };
}

function buildWordHandoffColumnUnion(
  sources: readonly SimulatedCellPlacement[],
  targets: readonly SimulatedCellPlacement[],
): number[] {
  const columns = new Set<number>();
  sources.forEach((source) => columns.add(source.x));
  targets.forEach((target) => columns.add(target.x));
  return [...columns].sort((left, right) => left - right);
}

function collectBlocksInColumnBand<T extends SimulatedCellPlacement>(
  placements: readonly T[],
  bandColumns: readonly number[],
): T[] {
  const bandSet = new Set(bandColumns);
  return placements.filter((placement) => bandSet.has(placement.x));
}

function resolveWordMorphBandGeometry(
  columnCount: number,
): { windowCount: number; windowSize: number } {
  if (columnCount <= 0) {
    return { windowCount: 0, windowSize: 0 };
  }
  const windowCountTarget = Math.max(3, Math.min(6, Math.ceil(columnCount / 3)));
  const windowSize = Math.max(2, Math.min(columnCount, Math.ceil(columnCount / windowCountTarget)));
  const windowCount = Math.max(1, Math.min(windowCountTarget, columnCount - windowSize + 1));
  return { windowCount, windowSize };
}

export function buildWordHandoffBridge(
  sourceCompiled: CompiledTypographyPhrase,
  targetCompiled: CompiledTypographyPhrase,
): PatternHandoffBridge {
  if (sourceCompiled.blocks.length === 0 || targetCompiled.blocks.length === 0) {
    throw new Error("Word handoff requires non-empty source and target phrases.");
  }

  const sourceFinalState = simulateCompiledPhraseToStep(
    sourceCompiled,
    sourceCompiled.steps.length - 1,
  );
  const targetFinalState = simulateCompiledPhraseToStep(
    targetCompiled,
    targetCompiled.steps.length - 1,
  );
  const sourcePlacements = toSimulatedCellPlacements(sourceFinalState);
  const targetPlacements = toSimulatedCellPlacements(targetFinalState);

  const targetEstablishStep = findFirstStepByHandoffRole(targetCompiled, "establish");
  if (!targetEstablishStep) {
    throw new Error(`${targetCompiled.patternId}: missing establish step for word handoff.`);
  }

  const sourceById = new Map(sourcePlacements.map((placement) => [placement.id, placement] as const));
  const targetById = new Map(targetPlacements.map((target) => [target.id, target] as const));
  const sharedIdSet = new Set<string>();
  targetPlacements.forEach((target) => {
    if (sourceById.has(target.id)) {
      sharedIdSet.add(target.id);
    }
  });

  interface WordMovePair {
    readonly id: string;
    readonly fromX: number;
    readonly fromY: number;
    readonly toX: number;
    readonly toY: number;
    readonly targetStackIndex: number;
  }
  const movePairs: WordMovePair[] = [];
  sharedIdSet.forEach((id) => {
    const src = sourceById.get(id);
    const tgt = targetById.get(id);
    if (!src || !tgt) {
      throw new Error(`Word handoff: missing placement for shared id ${id}.`);
    }
    movePairs.push({
      id,
      fromX: src.x,
      fromY: src.y,
      toX: tgt.x,
      toY: tgt.y,
      targetStackIndex: tgt.stackIndex,
    });
  });

  const nonSharedSources = sourcePlacements.filter((placement) => !sharedIdSet.has(placement.id));
  const nonSharedTargets = targetPlacements.filter((target) => !sharedIdSet.has(target.id));

  const { matched, surplus, deficit } = matchBlocksByPosition(nonSharedSources, nonSharedTargets);
  const surplusIdSet = new Set(surplus.map((entry) => entry.id));
  const deficitIdSet = new Set(deficit.map((entry) => entry.id));

  const unionColumns = buildWordHandoffColumnUnion(sourcePlacements, targetPlacements);
  const { windowCount, windowSize } = resolveWordMorphBandGeometry(unionColumns.length);
  const starts = buildCarrierWindowStarts(windowCount, unionColumns.length, windowSize);

  const whiteCarrierCap = Math.max(8, Math.floor(targetPlacements.length * 0.35));
  const firstBandColumns = unionColumns.slice(starts[0] ?? 0, (starts[0] ?? 0) + windowSize);
  const firstBandSources = collectBlocksInColumnBand(sourcePlacements, firstBandColumns);
  const firstBandSourceIds = uniqueBlockIds(firstBandSources.map((placement) => placement.id));
  const firstBandIdsForMark = firstBandSourceIds.slice(0, whiteCarrierCap);

  const stepDefinitions: StepDefinition[] = [
    {
      name: "Word Morph Mark",
      duration: 0.10,
      handoffRole: "accent",
      events: [
        createToneEvent(firstBandIdsForMark, "white"),
      ].filter((event): event is StepEvent => event !== null),
    },
  ];

  const matchedReverse = new Map<string, string>();
  matched.forEach((targetId, sourceId) => matchedReverse.set(targetId, sourceId));

  const aliveTargetIds: string[] = [];
  const dispatchedTargetIds = new Set<string>();
  const retiredSourceIds = new Set<string>();
  let previousBandIds = firstBandIdsForMark;

  starts.forEach((startIndex, bandIndex) => {
    const bandColumns = unionColumns.slice(startIndex, startIndex + windowSize);
    const bandColumnSet = new Set(bandColumns);
    const bandCarrierSources = collectBlocksInColumnBand(sourcePlacements, bandColumns)
      .filter((source) => !retiredSourceIds.has(source.id));
    const bandCarrierIds = uniqueBlockIds(bandCarrierSources.map((placement) => placement.id));
    const bandToneIds = bandCarrierIds.slice(0, whiteCarrierCap);
    const bandHideSources = collectBlocksInColumnBand(nonSharedSources, bandColumns)
      .filter((source) => !retiredSourceIds.has(source.id));
    const bandTargets = collectBlocksInColumnBand(nonSharedTargets, bandColumns)
      .filter((target) => !dispatchedTargetIds.has(target.id));

    const moveEvents: StepEvent[] = [];
    const hideEvents: StepEvent[] = [];
    const spawnEvents: StepEvent[] = [];

    movePairs.forEach((pair) => {
      if (retiredSourceIds.has(pair.id)) {
        return;
      }
      if (!bandColumnSet.has(pair.fromX)) {
        return;
      }
      moveEvents.push({
        type: "move" as const,
        blockId: pair.id,
        targetX: pair.toX,
        targetY: pair.toY,
        stackIndex: pair.targetStackIndex,
        state: "snap_move" as const,
      });
      retiredSourceIds.add(pair.id);
      dispatchedTargetIds.add(pair.id);
      aliveTargetIds.push(pair.id);
    });

    bandHideSources.forEach((source) => {
      hideEvents.push({
        type: "visibility" as const,
        blockIds: [source.id],
        visible: false,
      });
      retiredSourceIds.add(source.id);
    });

    bandTargets.forEach((target) => {
      const matchedSourceId = matchedReverse.get(target.id);
      let sourceId: string | undefined = matchedSourceId;
      if (!sourceId) {
        const liveSource = nonSharedSources.find((candidate) => (
          !retiredSourceIds.has(candidate.id)
        ));
        sourceId = liveSource?.id ?? aliveTargetIds[aliveTargetIds.length - 1];
      }
      if (!sourceId) {
        throw new Error(`Word handoff: no source available for target ${target.id}.`);
      }
      const state: Exclude<BlockState, "idle"> = matchedSourceId
        ? "screen_expand"
        : "duplicate_spawn";
      spawnEvents.push({
        type: "duplicate" as const,
        sourceId,
        blockId: target.id,
        targetX: target.x,
        targetY: target.y,
        stackIndex: target.stackIndex,
        state,
      });
      dispatchedTargetIds.add(target.id);
      aliveTargetIds.push(target.id);
    });

    const toneTransitions = bandIndex === 0
      ? []
      : buildCarrierToneTransitionEvents(previousBandIds, bandToneIds);

    stepDefinitions.push({
      name: `Word Morph Sweep ${bandIndex + 1}`,
      duration: 0.12,
      handoffRole: "redirect",
      events: [
        ...toneTransitions,
        createToneEvent(bandToneIds, "white"),
        ...moveEvents,
        ...hideEvents,
        ...spawnEvents,
      ].filter((event): event is StepEvent => event !== null),
    });

    previousBandIds = bandToneIds;
  });

  const remainingTargets = targetPlacements.filter((target) => !dispatchedTargetIds.has(target.id));
  const remainingSources = sourcePlacements.filter((source) => !retiredSourceIds.has(source.id));

  const settleEvents: StepEvent[] = [];
  settleEvents.push(...buildCarrierToneTransitionEvents(previousBandIds, []));

  if (remainingSources.length > 0) {
    settleEvents.push({
      type: "visibility" as const,
      blockIds: remainingSources.map((source) => source.id),
      visible: false,
    });
    remainingSources.forEach((source) => retiredSourceIds.add(source.id));
  }

  remainingTargets.forEach((target) => {
    const matchedSourceId = matchedReverse.get(target.id);
    const fallbackSourceId = matchedSourceId
      ?? aliveTargetIds[aliveTargetIds.length - 1]
      ?? sourcePlacements[0]?.id;
    if (!fallbackSourceId) {
      throw new Error(`Word handoff: settle step has no source for target ${target.id}.`);
    }
    settleEvents.push({
      type: "duplicate" as const,
      sourceId: fallbackSourceId,
      blockId: target.id,
      targetX: target.x,
      targetY: target.y,
      stackIndex: target.stackIndex,
      state: "duplicate_spawn" as const,
    });
    dispatchedTargetIds.add(target.id);
    aliveTargetIds.push(target.id);
  });

  const allTargetIds = uniqueBlockIds(targetPlacements.map((target) => target.id));
  const toneDarkEvent = createToneEvent(allTargetIds, "dark");
  if (toneDarkEvent) {
    settleEvents.push(toneDarkEvent);
  }
  settleEvents.push({
    type: "settle" as const,
    blockIds: allTargetIds,
    state: "stack_settle",
  });

  stepDefinitions.push({
    name: "Word Morph Settle",
    duration: 0.16,
    handoffRole: "settle",
    events: settleEvents.filter((event): event is StepEvent => event !== null),
  });

  if (dispatchedTargetIds.size !== targetPlacements.length) {
    throw new Error("Word handoff: some target blocks were never dispatched.");
  }
  if (deficitIdSet.size > 0 && ![...deficitIdSet].every((id) => dispatchedTargetIds.has(id))) {
    throw new Error("Word handoff: some deficit targets were never dispatched.");
  }

  return {
    steps: buildPhraseSteps(stepDefinitions),
    targetEstablishStep,
  };
}

export function buildPatternHandoffBridge(
  sourceCompiled: CompiledTypographyPhrase,
  targetCompiled: CompiledTypographyPhrase,
): PatternHandoffBridge {
  const sourceIds = uniqueBlockIds(sourceCompiled.blocks.map((placement) => placement.id));
  const targetIds = new Set(targetCompiled.blocks.map((placement) => placement.id));
  if (sourceIds.length !== targetIds.size || sourceIds.some((blockId) => !targetIds.has(blockId))) {
    throw new Error("Pattern handoff requires matching block identities across source and target phrases.");
  }

  const targetEstablishStep = findFirstStepByHandoffRole(targetCompiled, "establish");
  if (!targetEstablishStep) {
    throw new Error(`${targetCompiled.patternId}: missing establish step for pattern handoff.`);
  }

  const targetEstablishState = simulateCompiledPhraseToStep(targetCompiled, targetEstablishStep.index);
  const targetVisibleIds = new Set(targetEstablishState.visibleIds);
  const orderedColumns = groupBlocksByFinalColumn(sourceCompiled.blocks);
  const windowSize = Math.max(1, Math.min(2, orderedColumns.length));
  const windowCount = Math.max(1, orderedColumns.length - windowSize + 1);
  const starts = buildCarrierWindowStarts(windowCount, orderedColumns.length, windowSize);
  const firstBandIds = collectCarrierWindowIds(
    orderedColumns,
    starts[0] ?? 0,
    windowSize,
    (group) => group.blocks.map((placement) => placement.id),
  );

  const hiddenIds = new Set<string>();
  let previousBandIds = firstBandIds;
  const stepDefinitions: StepDefinition[] = [
    {
      name: "Handoff Mark",
      duration: 0.10,
      handoffRole: "accent",
      events: [
        createToneEvent(firstBandIds, "white"),
      ].filter((event): event is StepEvent => event !== null),
    },
  ];

  starts.forEach((startIndex, index) => {
    const bandIds = collectCarrierWindowIds(
      orderedColumns,
      startIndex,
      windowSize,
      (group) => group.blocks.map((placement) => placement.id),
    );
    const bandHideIds = bandIds.filter((blockId) => !targetVisibleIds.has(blockId) && !hiddenIds.has(blockId));
    bandHideIds.forEach((blockId) => hiddenIds.add(blockId));

    const moveEvents = bandIds.flatMap((blockId) => {
      if (!targetVisibleIds.has(blockId)) {
        return [];
      }

      const sourcePlacement = getBlockById(sourceCompiled.blocks, blockId);
      const targetState = targetEstablishState.blocks.get(blockId);
      if (!targetState) {
        throw new Error(`${targetCompiled.patternId}: missing establish state for ${blockId}.`);
      }

      if (
        sourcePlacement.finalX === targetState.x
        && sourcePlacement.finalY === targetState.y
        && sourcePlacement.stackIndex === targetState.stackIndex
      ) {
        return [];
      }

      return [{
        type: "move" as const,
        blockId,
        targetX: targetState.x,
        targetY: targetState.y,
        stackIndex: targetState.stackIndex,
        state: "screen_expand" as const,
      }];
    });

    stepDefinitions.push({
      name: `Handoff Sweep ${index + 1}`,
      duration: 0.12,
      handoffRole: "redirect",
      events: [
        ...(index === 0 ? [] : buildCarrierToneTransitionEvents(previousBandIds, bandIds)),
        createVisibilityEvent(bandHideIds, false),
        ...moveEvents,
      ].filter((event): event is StepEvent => event !== null),
    });

    previousBandIds = bandIds;
  });

  const remainingHideIds = sourceIds.filter((blockId) => !targetVisibleIds.has(blockId) && !hiddenIds.has(blockId));
  stepDefinitions.push({
    name: "Handoff Settle",
    duration: 0.16,
    handoffRole: "settle",
    events: [
      ...buildCarrierToneTransitionEvents(previousBandIds, []),
      createVisibilityEvent(remainingHideIds, false),
      createToneEvent(targetEstablishState.visibleIds, "dark"),
      {
        type: "settle" as const,
        blockIds: targetEstablishState.visibleIds,
        state: "stack_settle",
      },
    ].filter((event): event is StepEvent => event !== null),
  });

  return {
    steps: buildPhraseSteps(stepDefinitions),
    targetEstablishStep,
  };
}

export function getGlyphBlocks(
  blocks: readonly CompiledBlockPlacement[],
  glyphIndex: number,
): CompiledBlockPlacement[] {
  return blocks.filter((placement) => placement.glyphIndex === glyphIndex);
}

export function getBlockById(
  blocks: readonly CompiledBlockPlacement[],
  blockId: string,
): CompiledBlockPlacement {
  const block = blocks.find((placement) => placement.id === blockId);
  if (!block) {
    throw new Error(`Unknown compiled block: ${blockId}`);
  }
  return block;
}

export function sortBlocksByRowAndColumn(
  blocks: readonly CompiledBlockPlacement[],
): CompiledBlockPlacement[] {
  return [...blocks].sort((left, right) => (
    left.finalY - right.finalY || left.finalX - right.finalX || left.id.localeCompare(right.id)
  ));
}

export function sortBlocksByColumnAndRow(
  blocks: readonly CompiledBlockPlacement[],
): CompiledBlockPlacement[] {
  return [...blocks].sort((left, right) => (
    left.finalX - right.finalX || left.finalY - right.finalY || left.id.localeCompare(right.id)
  ));
}

export function withSpawnOverrides(
  blocks: readonly CompiledBlockPlacement[],
  resolver: (
    placement: CompiledBlockPlacement,
  ) => Partial<Pick<CompiledBlockPlacement, "spawnX" | "spawnY">> | undefined,
): CompiledBlockPlacement[] {
  return blocks.map((placement) => {
    const overrides = resolver(placement);
    return overrides ? { ...placement, ...overrides } : placement;
  });
}

export function partitionGlyphBlocksByBoundary(
  glyphBlocks: readonly CompiledBlockPlacement[],
): GlyphBoundaryPartition {
  const occupied = new Set(glyphBlocks.map((placement) => `${placement.finalX}:${placement.finalY}`));
  const outlineBlocks: CompiledBlockPlacement[] = [];
  const interiorBlocks: CompiledBlockPlacement[] = [];

  glyphBlocks.forEach((placement) => {
    const isBoundary = (
      !occupied.has(`${placement.finalX - 1}:${placement.finalY}`)
      || !occupied.has(`${placement.finalX + 1}:${placement.finalY}`)
      || !occupied.has(`${placement.finalX}:${placement.finalY - 1}`)
      || !occupied.has(`${placement.finalX}:${placement.finalY + 1}`)
    );

    if (isBoundary) {
      outlineBlocks.push(placement);
      return;
    }

    interiorBlocks.push(placement);
  });

  return {
    outlineBlocks: sortBlocksByRowAndColumn(outlineBlocks),
    interiorBlocks: sortBlocksByRowAndColumn(interiorBlocks),
  };
}

export function groupBlocksByFinalColumn(
  blocks: readonly CompiledBlockPlacement[],
): FinalColumnGroup[] {
  const columns = new Map<number, CompiledBlockPlacement[]>();

  sortBlocksByColumnAndRow(blocks).forEach((placement) => {
    const columnBlocks = columns.get(placement.finalX);
    if (columnBlocks) {
      columnBlocks.push(placement);
      return;
    }

    columns.set(placement.finalX, [placement]);
  });

  return [...columns.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([columnX, columnBlocks]) => ({
      columnX,
      blocks: columnBlocks,
    }));
}

export function buildGlyphHorizontalOvershootOffsets(
  grid: TypographyGridLayout,
  glyphs: readonly CompiledGlyphPlacement[],
  blocks: readonly CompiledBlockPlacement[],
): number[] {
  const centerIndex = (glyphs.length - 1) * 0.5;

  return glyphs.map((glyph) => {
    const distanceRank = Math.min(2, Math.ceil(Math.abs(glyph.index - centerIndex)));
    if (distanceRank === 0) {
      return 0;
    }

    const glyphBlocks = getGlyphBlocks(blocks, glyph.index);
    const minX = Math.min(...glyphBlocks.map((placement) => placement.finalX));
    const maxX = Math.max(...glyphBlocks.map((placement) => placement.finalX));
    const direction = glyph.index < centerIndex ? -1 : 1;
    const available = direction < 0 ? minX : (grid.cols - 1 - maxX);
    return direction * Math.min(distanceRank, available);
  });
}

export function chooseGlyphVerticalSpawnDirection(
  grid: TypographyGridLayout,
  glyphBlocks: readonly CompiledBlockPlacement[],
): 1 | -1 {
  const maxFinalY = Math.max(...glyphBlocks.map((placement) => placement.finalY));
  return maxFinalY + 1 <= grid.rows - 2 ? 1 : -1;
}

export function getCenterLeadGlyphIndex(glyphCount: number): number {
  return Math.floor((glyphCount - 1) * 0.5);
}

export function buildBilateralGlyphOrder(
  glyphCount: number,
  leadGlyphIndex: number,
): number[] {
  const order = [leadGlyphIndex];

  for (let offset = 1; order.length < glyphCount; offset += 1) {
    const right = leadGlyphIndex + offset;
    if (right < glyphCount) {
      order.push(right);
    }

    const left = leadGlyphIndex - offset;
    if (left >= 0) {
      order.push(left);
    }
  }

  return order;
}

let tickerGenerationCounter = 0;

function nextTickerGeneration(): number {
  tickerGenerationCounter += 1;
  return tickerGenerationCounter;
}

function rewriteEventIds(event: DiscreteEvent, suffix: string): DiscreteEvent {
  if (event.type === "blink") {
    return { ...event, blockId: event.blockId + suffix };
  }
  if (event.type === "duplicate") {
    return {
      ...event,
      sourceId: event.sourceId + suffix,
      blockId: event.blockId + suffix,
    };
  }
  if (event.type === "move") {
    return { ...event, blockId: event.blockId + suffix };
  }
  if (event.type === "settle") {
    return event.blockIds
      ? { ...event, blockIds: event.blockIds.map((id) => id + suffix) }
      : event;
  }
  if (event.type === "tone") {
    return { ...event, blockIds: event.blockIds.map((id) => id + suffix) };
  }
  if (event.type === "visibility") {
    return { ...event, blockIds: event.blockIds.map((id) => id + suffix) };
  }
  if (event.type === "ticker_scroll") {
    return { ...event, blockIds: event.blockIds.map((id) => id + suffix) };
  }
  return event;
}

export function cloneCompiledWithIdSuffix(
  compiled: CompiledTypographyPhrase,
  suffix: string,
): CompiledTypographyPhrase {
  const rewrittenBlocks = compiled.blocks.map((placement) => ({
    ...placement,
    id: placement.id + suffix,
  }));
  const rewrittenGlyphs = compiled.glyphs.map((glyph) => ({
    ...glyph,
    anchorId: glyph.anchorId + suffix,
    sourceId: glyph.sourceId + suffix,
    terminalId: glyph.terminalId + suffix,
    blockIds: glyph.blockIds.map((id) => id + suffix),
  }));
  const rewrittenSteps: PhraseStep[] = compiled.steps.map((step) => ({
    ...step,
    events: step.events.map((event) => rewriteEventIds(event, suffix)),
  }));

  return {
    patternId: compiled.patternId,
    token: compiled.token,
    leadAnchorId: compiled.leadAnchorId + suffix,
    blocks: rewrittenBlocks,
    glyphs: rewrittenGlyphs,
    steps: rewrittenSteps,
  };
}

const TICKER_MARK_DURATION = 0.10;
const TICKER_SCROLL_DURATION = 1.60;
const TICKER_SETTLE_DURATION = 0.20;
const TICKER_OFFSCREEN_MARGIN = 5;
const TICKER_MIN_COLS = 15;

export interface ElectricTickerProfile {
  readonly totalDuration: number;
  readonly chargeRatio: number;
  readonly strikeRatio: number;
  readonly glowRatio: number;
  readonly settleRatio: number;
}

export const DEFAULT_ELECTRIC_PROFILE: ElectricTickerProfile = {
  totalDuration: 1.5,
  chargeRatio: 0.10,
  strikeRatio: 0.17,
  glowRatio: 0.40,
  settleRatio: 0.33,
};

export type ElectricTickerTemplate = "sequential" | "spatial";
export type ElectricStrikeAxis = "horizontal" | "vertical" | "radial";
export type ElectricFlickerMode = "chain" | "burst" | "wipe" | "scatter";
export type ElectricScrollDirection =
  | "LtoR"
  | "RtoL"
  | "bilateral"
  | "centerOut"
  | "scatter";
export type ElectricGridPulseSync =
  | "none"
  | "horizontal"
  | "tier"
  | "radial"
  | "column"
  | "full";

export type DelayOrderer = (
  blocks: readonly CompiledBlockPlacement[],
  grid: TypographyGridLayout,
) => ReadonlyMap<string, number>;

export interface ElectricTickerCharacter {
  readonly template: ElectricTickerTemplate;
  readonly delayOrderer: DelayOrderer;
  readonly strikeAxis: ElectricStrikeAxis;
  readonly flickerMode: ElectricFlickerMode;
  readonly scrollDirection: ElectricScrollDirection;
  readonly chargeDuration: number;
  readonly strikeDuration: number;
  readonly glowDuration: number;
  readonly settleDuration: number;
  readonly flickerFreq: number;
  readonly flickerAmp: number;
  readonly displacementAmp: number;
  readonly yOffsetAmp: number;
  readonly rgbSplitBump: number;
  readonly zoomPush: number;
  readonly bgFlashIntensity: number;
  readonly gridPulseSync: ElectricGridPulseSync;
}

export function buildTickerHandoffBridge(
  sourceCompiled: CompiledTypographyPhrase,
  targetCompiled: CompiledTypographyPhrase,
  grid: TypographyGridLayout,
): PatternHandoffBridge {
  if (sourceCompiled.blocks.length === 0 || targetCompiled.blocks.length === 0) {
    throw new Error("Ticker handoff requires non-empty source and target phrases.");
  }
  if (grid.cols < TICKER_MIN_COLS) {
    throw new Error(`Ticker handoff requires grid.cols >= ${TICKER_MIN_COLS}, got ${grid.cols}.`);
  }

  const sourceFinalState = simulateCompiledPhraseToStep(
    sourceCompiled,
    sourceCompiled.steps.length - 1,
  );
  const targetFinalState = simulateCompiledPhraseToStep(
    targetCompiled,
    targetCompiled.steps.length - 1,
  );
  const sourcePlacements = toSimulatedCellPlacements(sourceFinalState);
  const targetPlacements = toSimulatedCellPlacements(targetFinalState);

  if (sourcePlacements.length === 0 || targetPlacements.length === 0) {
    throw new Error("Ticker handoff requires visible blocks in both source and target states.");
  }

  const suffix = `#tk${nextTickerGeneration()}`;
  const rewrittenTargetCompiled = cloneCompiledWithIdSuffix(targetCompiled, suffix);
  const targetEstablishStep = findFirstStepByHandoffRole(rewrittenTargetCompiled, "establish");
  if (!targetEstablishStep) {
    throw new Error(`${rewrittenTargetCompiled.patternId}: missing establish step for ticker handoff.`);
  }

  const L = grid.cols + TICKER_OFFSCREEN_MARGIN;
  const sourceIds = uniqueBlockIds(sourcePlacements.map((placement) => placement.id));
  const rewrittenTargetIds = uniqueBlockIds(
    targetPlacements.map((placement) => placement.id + suffix),
  );
  const representativeSourceId = sourceIds[0];
  if (!representativeSourceId) {
    throw new Error("Ticker handoff: source must have at least one block.");
  }

  const markEvents: StepEvent[] = [];
  targetPlacements.forEach((target) => {
    markEvents.push({
      type: "duplicate" as const,
      sourceId: representativeSourceId,
      blockId: target.id + suffix,
      targetX: target.x + L,
      targetY: target.y,
      stackIndex: target.stackIndex,
      state: "idle" as Exclude<BlockState, "idle">,
    });
  });
  const whiteSourceTone = createToneEvent(sourceIds, "white");
  if (whiteSourceTone) {
    markEvents.push(whiteSourceTone);
  }
  const whiteTargetTone = createToneEvent(rewrittenTargetIds, "white");
  if (whiteTargetTone) {
    markEvents.push(whiteTargetTone);
  }

  const scrollEvents: StepEvent[] = [
    {
      type: "ticker_scroll" as const,
      blockIds: sourceIds,
      startOffset: 0,
      endOffset: -L,
    },
    {
      type: "ticker_scroll" as const,
      blockIds: rewrittenTargetIds,
      startOffset: 0,
      endOffset: -L,
    },
  ];

  const settleEvents: StepEvent[] = [];
  settleEvents.push({
    type: "visibility" as const,
    blockIds: sourceIds,
    visible: false,
  });
  targetPlacements.forEach((target) => {
    settleEvents.push({
      type: "move" as const,
      blockId: target.id + suffix,
      targetX: target.x,
      targetY: target.y,
      stackIndex: target.stackIndex,
      state: "snap_move" as Exclude<BlockState, "idle">,
    });
  });
  const darkToneEvent = createToneEvent(rewrittenTargetIds, "dark");
  if (darkToneEvent) {
    settleEvents.push(darkToneEvent);
  }
  settleEvents.push({
    type: "settle" as const,
    blockIds: rewrittenTargetIds,
    state: "stack_settle" as Exclude<BlockState, "idle">,
  });

  const stepDefinitions: StepDefinition[] = [
    {
      name: "Ticker Mark",
      duration: TICKER_MARK_DURATION,
      handoffRole: "accent",
      events: markEvents,
    },
    {
      name: "Ticker Scroll",
      duration: TICKER_SCROLL_DURATION,
      handoffRole: "redirect",
      events: scrollEvents,
    },
    {
      name: "Ticker Settle",
      duration: TICKER_SETTLE_DURATION,
      handoffRole: "settle",
      events: settleEvents,
    },
  ];

  return {
    steps: buildPhraseSteps(stepDefinitions),
    targetEstablishStep,
    rewrittenTargetCompiled,
  };
}

// ---- Electric Ticker v2 (8-pattern linkage) ----

export const orderByFinalX: DelayOrderer = (blocks) => {
  const map = new Map<string, number>();
  if (blocks.length === 0) {
    return map;
  }
  const xs = blocks.map((b) => b.finalX);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const range = Math.max(1, maxX - minX);
  blocks.forEach((b) => {
    map.set(b.id, (b.finalX - minX) / range);
  });
  return map;
};

export const orderByAnchorDistance: DelayOrderer = (blocks) => {
  const map = new Map<string, number>();
  if (blocks.length === 0) {
    return map;
  }
  const anchor = blocks.find((b) => b.isAnchor) ?? blocks[0];
  const distances = blocks.map((b) => {
    const dx = b.finalX - anchor.finalX;
    const dy = b.finalY - anchor.finalY;
    return Math.sqrt(dx * dx + dy * dy);
  });
  const maxDist = Math.max(1, ...distances);
  blocks.forEach((b, i) => {
    map.set(b.id, distances[i] / maxDist);
  });
  return map;
};

export const orderByCenterOutDistance: DelayOrderer = (blocks) => {
  const map = new Map<string, number>();
  if (blocks.length === 0) {
    return map;
  }
  const xs = blocks.map((b) => b.finalX);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const centerX = (minX + maxX) / 2;
  const maxAbs = Math.max(1, (maxX - minX) / 2);
  blocks.forEach((b) => {
    map.set(b.id, Math.abs(b.finalX - centerX) / maxAbs);
  });
  return map;
};

export const orderByStagger3Band: DelayOrderer = (blocks) => {
  const map = new Map<string, number>();
  if (blocks.length === 0) {
    return map;
  }
  const ys = blocks.map((b) => b.finalY);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const range = Math.max(1, maxY - minY);
  blocks.forEach((b) => {
    const tier = Math.min(2, Math.floor(((b.finalY - minY) / range) * 3));
    map.set(b.id, tier / 2);
  });
  return map;
};

export const orderByBoundaryThenInterior: DelayOrderer = (blocks) => {
  const map = new Map<string, number>();
  blocks.forEach((b) => {
    map.set(b.id, b.isAnchor || b.isTerminal ? 0 : 1);
  });
  return map;
};

export const orderByBilateralOvershoot: DelayOrderer = orderByCenterOutDistance;

export const orderByScatter: DelayOrderer = (blocks) => {
  const map = new Map<string, number>();
  blocks.forEach((b) => {
    let h = 0;
    for (let i = 0; i < b.id.length; i += 1) {
      h = (h * 31 + b.id.charCodeAt(i)) | 0;
    }
    map.set(b.id, (Math.abs(h) % 1000) / 1000);
  });
  return map;
};

function scaleDelays(
  phaseMap: ReadonlyMap<string, number>,
  maxDelaySeconds: number,
): Map<string, number> {
  const out = new Map<string, number>();
  phaseMap.forEach((phase, id) => {
    out.set(id, clamp(phase, 0, 1) * maxDelaySeconds);
  });
  return out;
}

export function buildElectricTickerHandoffBridge(
  sourceCompiled: CompiledTypographyPhrase,
  targetCompiled: CompiledTypographyPhrase,
  grid: TypographyGridLayout,
  character: ElectricTickerCharacter,
  profile: ElectricTickerProfile = DEFAULT_ELECTRIC_PROFILE,
): PatternHandoffBridge {
  if (sourceCompiled.blocks.length === 0 || targetCompiled.blocks.length === 0) {
    throw new Error("Electric ticker handoff requires non-empty source and target phrases.");
  }
  if (grid.cols < TICKER_MIN_COLS) {
    throw new Error(
      `Electric ticker handoff requires grid.cols >= ${TICKER_MIN_COLS}, got ${grid.cols}.`,
    );
  }

  const sourceFinalState = simulateCompiledPhraseToStep(
    sourceCompiled,
    sourceCompiled.steps.length - 1,
  );
  const targetFinalState = simulateCompiledPhraseToStep(
    targetCompiled,
    targetCompiled.steps.length - 1,
  );
  const sourcePlacements = toSimulatedCellPlacements(sourceFinalState);
  const targetPlacements = toSimulatedCellPlacements(targetFinalState);

  if (sourcePlacements.length === 0 || targetPlacements.length === 0) {
    throw new Error("Electric ticker handoff requires visible blocks in both source and target.");
  }

  const suffix = `#tk${nextTickerGeneration()}`;
  const rewrittenTargetCompiled = cloneCompiledWithIdSuffix(targetCompiled, suffix);
  const targetEstablishStep = findFirstStepByHandoffRole(rewrittenTargetCompiled, "establish");
  if (!targetEstablishStep) {
    throw new Error(
      `${rewrittenTargetCompiled.patternId}: missing establish step for electric ticker handoff.`,
    );
  }

  const L = grid.cols + TICKER_OFFSCREEN_MARGIN;
  const sourceIds = uniqueBlockIds(sourcePlacements.map((p) => p.id));
  const rewrittenTargetIds = uniqueBlockIds(
    targetPlacements.map((p) => p.id + suffix),
  );
  const representativeSourceId = sourceIds[0];
  if (!representativeSourceId) {
    throw new Error("Electric ticker handoff: source must have at least one block.");
  }

  const { chargeDuration, strikeDuration, glowDuration, settleDuration } = character;
  const yAmp = character.yOffsetAmp;

  const sourceDelayPhaseMap = character.delayOrderer(sourceCompiled.blocks, grid);
  const targetDelayPhaseMap = character.delayOrderer(rewrittenTargetCompiled.blocks, grid);

  const maxDelaySeconds = Math.min(glowDuration * 0.5, 0.25);
  const perBlockDuration = Math.max(0.05, glowDuration - maxDelaySeconds);
  const sourceDelays = scaleDelays(sourceDelayPhaseMap, maxDelaySeconds);
  const targetDelays = scaleDelays(targetDelayPhaseMap, maxDelaySeconds);

  const chargeEvents: StepEvent[] = [];
  targetPlacements.forEach((target) => {
    chargeEvents.push({
      type: "duplicate" as const,
      sourceId: representativeSourceId,
      blockId: target.id + suffix,
      targetX: target.x + L,
      targetY: target.y,
      stackIndex: target.stackIndex,
      state: "idle" as Exclude<BlockState, "idle">,
    });
  });
  const whiteSourceTone = createToneEvent(sourceIds, "white");
  if (whiteSourceTone) {
    chargeEvents.push(whiteSourceTone);
  }
  const whiteTargetTone = createToneEvent(rewrittenTargetIds, "white");
  if (whiteTargetTone) {
    chargeEvents.push(whiteTargetTone);
  }

  const strikeEvents: StepEvent[] = [
    {
      type: "settle",
      blockIds: [...sourceIds, ...rewrittenTargetIds],
      state: "ticker_strike",
    },
  ];
  const sparkTone = createToneEvent(
    [...sourceIds, ...rewrittenTargetIds],
    "spark",
  );
  if (sparkTone) {
    strikeEvents.push(sparkTone);
  }

  const scrollEvents: StepEvent[] = [
    {
      type: "ticker_scroll",
      blockIds: sourceIds,
      startOffset: 0,
      endOffset: -L,
      startOffsetY: 0,
      endOffsetY: 0,
      perBlockDelays: sourceDelays,
      perBlockDuration,
    },
    {
      type: "ticker_scroll",
      blockIds: rewrittenTargetIds,
      startOffset: 0,
      endOffset: -L,
      startOffsetY: yAmp,
      endOffsetY: 0,
      perBlockDelays: targetDelays,
      perBlockDuration,
    },
  ];
  const whiteAgainTargetTone = createToneEvent(rewrittenTargetIds, "white");
  if (whiteAgainTargetTone) {
    scrollEvents.push(whiteAgainTargetTone);
  }

  const settleEvents: StepEvent[] = [];
  settleEvents.push({
    type: "visibility",
    blockIds: sourceIds,
    visible: false,
  });
  targetPlacements.forEach((target) => {
    settleEvents.push({
      type: "move",
      blockId: target.id + suffix,
      targetX: target.x,
      targetY: target.y,
      stackIndex: target.stackIndex,
      state: "snap_move",
    });
  });
  const darkToneEvent = createToneEvent(rewrittenTargetIds, "dark");
  if (darkToneEvent) {
    settleEvents.push(darkToneEvent);
  }
  settleEvents.push({
    type: "settle",
    blockIds: rewrittenTargetIds,
    state: "stack_settle",
  });

  const stepDefinitions: StepDefinition[] = [
    {
      name: "Electric Charge",
      duration: chargeDuration,
      handoffRole: "accent",
      events: chargeEvents,
    },
    {
      name: "Electric Strike",
      duration: strikeDuration,
      handoffRole: "redirect",
      events: strikeEvents,
    },
    {
      name: "Electric Glow",
      duration: glowDuration,
      handoffRole: "redirect",
      events: scrollEvents,
    },
    {
      name: "Electric Settle",
      duration: settleDuration,
      handoffRole: "settle",
      events: settleEvents,
    },
  ];

  return {
    steps: buildPhraseSteps(stepDefinitions),
    targetEstablishStep,
    rewrittenTargetCompiled,
  };
}
