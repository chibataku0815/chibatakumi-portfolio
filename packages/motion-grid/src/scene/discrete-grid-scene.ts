import {
  compileHeroWordPattern,
  compileDefaultHeroWordPattern,
  DEFAULT_HERO_WORD_PATTERN_ID,
  ELECTRIC_TICKER_CHARACTERS,
  type HeroWordPatternId,
} from "./typography/hero-word-pattern-registry";
import {
  buildElectricTickerHandoffBridge,
  buildPatternHandoffBridge,
  buildWordHandoffBridge,
  DEFAULT_ELECTRIC_PROFILE,
  type HandoffRole,
  type PatternHandoffBridge,
  CompiledTypographyPhrase,
  TypographyGridLayout,
} from "./typography/hero-word-pattern-shared";
import {
  DEFAULT_HERO_TOKEN,
  MAX_HERO_TOKEN_BLOCKS,
  MAX_HERO_TOKEN_CHARS,
  MIN_HERO_TOKEN_CHARS,
  normalizeHeroToken,
  resolveHeroTokenSpec,
  sanitizeHeroTokenInput,
} from "./typography/hero-token";
export { DEFAULT_HERO_TOKEN } from "./typography/hero-token";

export type BlockTone = "dark" | "white" | "spark" | "glow";

export type BlockState =
  | "idle"
  | "blink"
  | "snap_move"
  | "duplicate_spawn"
  | "stack_settle"
  | "screen_expand"
  | "screen_slam"
  | "ticker_scroll"
  | "ticker_strike";

export type DiscreteEvent =
  | {
    readonly at: number;
    readonly type: "blink";
    readonly blockId: string;
  }
  | {
    readonly at: number;
    readonly type: "duplicate";
    readonly sourceId: string;
    readonly blockId: string;
    readonly targetX: number;
    readonly targetY: number;
    readonly stackIndex: number;
    readonly state?: Exclude<BlockState, "idle">;
  }
  | {
    readonly at: number;
    readonly type: "move";
    readonly blockId: string;
    readonly targetX: number;
    readonly targetY: number;
    readonly stackIndex?: number;
    readonly state?: Exclude<BlockState, "idle">;
  }
  | {
    readonly at: number;
    readonly type: "settle";
    readonly blockIds?: readonly string[];
    readonly state?: Exclude<BlockState, "idle">;
  }
  | {
    readonly at: number;
    readonly type: "tone";
    readonly blockIds: readonly string[];
    readonly tone: BlockTone;
  }
  | {
    readonly at: number;
    readonly type: "visibility";
    readonly blockIds: readonly string[];
    readonly visible: boolean;
  }
  | {
    readonly at: number;
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

export interface PhraseStep {
  readonly index: number;
  readonly name: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly handoffRole?: HandoffRole;
  readonly events: readonly DiscreteEvent[];
}

export interface GridPalette {
  readonly background: string;
  readonly dark: string;
  readonly white: string;
  readonly spark: string;
  readonly glow: string;
}

export interface GridConfig {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  readonly originX: number;
  readonly originY: number;
  readonly cols: number;
  readonly rows: number;
  readonly margin: number;
  readonly lineWeight: number;
  readonly cornerRadius: number;
  readonly majorEvery: number;
  readonly palette: GridPalette;
}

export interface BlockInstance {
  readonly id: string;
  cellX: number;
  cellY: number;
  stackIndex: number;
  state: BlockState;
  stateAge: number;
  visible: boolean;
  tone: BlockTone;
  renderOffsetX: number;
  renderOffsetY: number;
  tickerStartOffset: number;
  tickerEndOffset: number;
  tickerStartOffsetY: number;
  tickerEndOffsetY: number;
  tickerStartDelay: number;
  tickerStageDuration: number;
  strikeAmp: number;
}

export interface DiscreteGridSnapshot {
  readonly sceneName: string;
  readonly patternId: HeroWordPatternId;
  readonly grid: GridConfig;
  readonly heroToken: string;
  readonly presentationZoomScale: number;
  readonly blocks: readonly BlockInstance[];
  readonly currentStep: PhraseStep;
  readonly stepCount: number;
  readonly phraseTime: number;
  readonly cycleDuration: number;
  readonly loopEnabled: boolean;
  readonly holdingAtEnd: boolean;
  readonly time: number;
  readonly strikePhase: number;
  readonly strikeFlag: number;
  readonly flickerIntensity: number;
  readonly glowMix: number;
}

export type HeroTokenValidation =
  | {
    readonly ok: true;
    readonly normalizedToken: string;
    readonly blockCount: number;
    readonly maxBlocks: number;
  }
  | {
    readonly ok: false;
    readonly normalizedToken: string;
    readonly blockCount: number;
    readonly maxBlocks: number;
    readonly reason: "length" | "budget";
  };

export interface DiscreteGridScene {
  update(dt: number): void;
  resize(width: number, height: number): void;
  reset(): void;
  zoomIn(): void;
  zoomOut(): void;
  resetZoomToDefault(): void;
  startPatternHandoff(patternId: HeroWordPatternId): boolean;
  isPatternHandoffActive(): boolean;
  startWordHandoff(token: string): boolean;
  isWordHandoffActive(): boolean;
  isAnyHandoffActive(): boolean;
  setHeroToken(token: string): void;
  setLoopEnabled(enabled: boolean): void;
  setPatternId(patternId: HeroWordPatternId): void;
  validateHeroToken(token: string): HeroTokenValidation;
  validateWordMorph(token: string): WordMorphValidation;
  getSnapshot(): DiscreteGridSnapshot;
  destroy(): void;
}

export type WordMorphValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "format" | "compile" };

interface MutableGridConfig extends GridConfig {
  readonly anchorX: number;
  readonly anchorY: number;
}

interface PatternHandoffState {
  readonly targetPatternId: HeroWordPatternId;
  readonly targetCompiled: CompiledTypographyPhrase;
  readonly targetEstablishStep: PhraseStep;
  readonly targetEventIndex: number;
}

interface WordHandoffState {
  readonly targetToken: string;
  readonly targetCompiled: CompiledTypographyPhrase;
}

interface GridLayoutProfile {
  readonly targetCols: number;
  readonly targetRows: number;
  readonly marginRatio: number;
  readonly minCellSize: number;
  readonly maxCellSize: number;
  readonly glyphSpacing: number;
}

const SCENE_NAME = "Grid Typography / Hero Word";

const PALETTE: GridPalette = {
  background: "#D1D1D1",
  dark: "#1a1a1a",
  white: "#ffffff",
  spark: "#fffff2",
  glow: "#b3d9ff",
};

export const BLOCK_STATE_DURATIONS: Readonly<Record<BlockState, number>> = {
  idle: Number.POSITIVE_INFINITY,
  blink: 0.14,
  snap_move: 0.20,
  duplicate_spawn: 0.20,
  stack_settle: 0.28,
  screen_expand: 0.26,
  screen_slam: 0.30,
  ticker_scroll: 1.60,
  ticker_strike: 0.35,
};

const EPSILON = 1e-6;

const GRID_BASELINE_PROFILE: GridLayoutProfile = {
  targetCols: 72,
  targetRows: 18,
  marginRatio: 0.05,
  minCellSize: 12,
  maxCellSize: 34,
  glyphSpacing: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function cellKey(x: number, y: number): string {
  return `${x}:${y}`;
}

const PRESENTATION_ZOOM_LADDER = [1.0, 1.25, 1.5, 2.0, 2.5, 3.0] as const;
const DEFAULT_PRESENTATION_ZOOM_SCALE = PRESENTATION_ZOOM_LADDER[0];
const ZOOM_LADDER_MATCH_TOLERANCE = 1e-3;

function stepPresentationZoom(current: number, direction: 1 | -1): number {
  let index = PRESENTATION_ZOOM_LADDER.findIndex(
    (candidate) => Math.abs(candidate - current) < ZOOM_LADDER_MATCH_TOLERANCE,
  );
  if (index < 0) {
    index = PRESENTATION_ZOOM_LADDER.reduce(
      (best, candidate, candidateIndex) =>
        Math.abs(candidate - current) < Math.abs(PRESENTATION_ZOOM_LADDER[best] - current)
          ? candidateIndex
          : best,
      0,
    );
  }
  const next = index + direction;
  if (next < 0 || next >= PRESENTATION_ZOOM_LADDER.length) {
    return current;
  }
  return PRESENTATION_ZOOM_LADDER[next];
}

function makeTypographyLayout(
  grid: GridConfig,
  profile: GridLayoutProfile,
): TypographyGridLayout {
  return {
    cols: grid.cols,
    rows: grid.rows,
    glyphSpacing: profile.glyphSpacing,
  };
}

function validateHeroTokenInput(token: string): HeroTokenValidation {
  const normalizedToken = sanitizeHeroTokenInput(token).slice(0, MAX_HERO_TOKEN_CHARS);

  if (
    normalizedToken.length < MIN_HERO_TOKEN_CHARS
    || normalizedToken.length > MAX_HERO_TOKEN_CHARS
  ) {
    return {
      ok: false,
      normalizedToken,
      blockCount: 0,
      maxBlocks: MAX_HERO_TOKEN_BLOCKS,
      reason: "length",
    };
  }

  const tokenSpec = resolveHeroTokenSpec(normalizedToken);
  if (tokenSpec.blockCount > MAX_HERO_TOKEN_BLOCKS) {
    return {
      ok: false,
      normalizedToken,
      blockCount: tokenSpec.blockCount,
      maxBlocks: MAX_HERO_TOKEN_BLOCKS,
      reason: "budget",
    };
  }

  return {
    ok: true,
    normalizedToken,
    blockCount: tokenSpec.blockCount,
    maxBlocks: MAX_HERO_TOKEN_BLOCKS,
  };
}

function makeGridConfig(
  width: number,
  height: number,
  profile: GridLayoutProfile,
): MutableGridConfig {
  const minDimension = Math.min(width, height);
  const baseMargin = Math.max(12, Math.round(minDimension * profile.marginRatio));
  const cellSize = clamp(
    Math.floor(
      Math.min(
        (width - baseMargin * 2) / profile.targetCols,
        (height - baseMargin * 2) / profile.targetRows,
      ),
    ),
    profile.minCellSize,
    profile.maxCellSize,
  );
  const margin = Math.max(cellSize, baseMargin);
  const cols = Math.max(8, Math.floor((width - margin * 2) / cellSize));
  const rows = Math.max(8, Math.floor((height - margin * 2) / cellSize));
  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;
  const originX = Math.floor((width - gridWidth) / 2);
  const originY = Math.floor((height - gridHeight) / 2);
  const anchorX = Math.floor(cols * 0.5);
  const anchorY = Math.floor(rows * 0.5);

  return {
    width,
    height,
    cellSize,
    originX,
    originY,
    cols,
    rows,
    margin,
    lineWeight: 1.0,
    cornerRadius: Math.round(cellSize * 0.16),
    majorEvery: 4,
    palette: PALETTE,
    anchorX,
    anchorY,
  };
}

export function createDiscreteGridScene(): DiscreteGridScene {
  const gridScaleProfile = GRID_BASELINE_PROFILE;
  let grid = makeGridConfig(1280, 720, gridScaleProfile);
  let committedHeroToken = normalizeHeroToken(DEFAULT_HERO_TOKEN);
  let patternId: HeroWordPatternId = DEFAULT_HERO_WORD_PATTERN_ID;
  let compiled = compileDefaultHeroWordPattern(
    makeTypographyLayout(grid, gridScaleProfile),
    committedHeroToken,
  );
  committedHeroToken = compiled.token;
  let steps = compiled.steps;
  let cycleDuration = steps.at(-1)?.endTime ?? 1;
  let flattenedEvents: readonly DiscreteEvent[] = steps.flatMap((step) => step.events);
  let phraseTime = 0;
  let elapsedTime = 0;
  let strikePhase = 0;
  let strikeFlag = 0;
  let flickerIntensity = 0;
  let glowMix = 0;
  let electricTimeline: {
    readonly chargeDur: number;
    readonly strikeDur: number;
    readonly glowDur: number;
    readonly settleDur: number;
  } | null = null;
  let nextEventIndex = 0;
  let loopEnabled = true;
  let holdingAtEnd = false;
  let presentationZoomScale: number = DEFAULT_PRESENTATION_ZOOM_SCALE;
  let patternHandoff: PatternHandoffState | null = null;
  let wordHandoff: WordHandoffState | null = null;
  let sortedBlocksCache: readonly BlockInstance[] | null = null;
  let snapshotCache: DiscreteGridSnapshot | null = null;

  const blocks = new Map<string, BlockInstance>();
  const occupancy = new Map<string, string>();

  function clearScene(): void {
    blocks.clear();
    occupancy.clear();
  }

  function invalidateDerivedState(): void {
    sortedBlocksCache = null;
    snapshotCache = null;
  }

  function setSteps(nextSteps: readonly PhraseStep[], fallbackCycleDuration = 1): void {
    steps = nextSteps;
    flattenedEvents = steps.flatMap((step) => step.events);
    cycleDuration = steps.at(-1)?.endTime ?? fallbackCycleDuration;
    snapshotCache = null;
  }

  function occupy(block: BlockInstance): void {
    occupancy.set(cellKey(block.cellX, block.cellY), block.id);
  }

  function release(block: BlockInstance): void {
    occupancy.delete(cellKey(block.cellX, block.cellY));
  }

  function addBlock(block: BlockInstance): void {
    if (block.visible) {
      const key = cellKey(block.cellX, block.cellY);
      const existing = occupancy.get(key);
      if (existing && existing !== block.id) {
        throw new Error(`Cell ${key} is already occupied by ${existing}.`);
      }
      occupy(block);
    }
    blocks.set(block.id, block);
  }

  function getBlock(blockId: string): BlockInstance {
    const block = blocks.get(blockId);
    if (!block) {
      throw new Error(`Unknown block: ${blockId}`);
    }
    return block;
  }

  function placeAnchorBlock(): void {
    const anchor = compiled.blocks.find((placement) => placement.id === compiled.leadAnchorId);
    if (!anchor) {
      throw new Error("Typography scene could not find an anchor block.");
    }

    addBlock({
      id: anchor.id,
      cellX: anchor.finalX,
      cellY: anchor.finalY,
      stackIndex: anchor.stackIndex,
      state: "idle",
      stateAge: 0,
      visible: true,
      tone: "dark",
      renderOffsetX: 0,
      renderOffsetY: 0,
      tickerStartOffset: 0,
      tickerEndOffset: 0,
      tickerStartOffsetY: 0,
      tickerEndOffsetY: 0,
      tickerStartDelay: 0,
      tickerStageDuration: 0,
      strikeAmp: 0,
    });
  }

  function rebuildTimeline(nextToken: string = committedHeroToken): void {
    const validation = validateHeroTokenInput(nextToken);
    committedHeroToken = validation.ok
      ? validation.normalizedToken
      : normalizeHeroToken(DEFAULT_HERO_TOKEN);
    compiled = compileHeroWordPattern(
      makeTypographyLayout(grid, gridScaleProfile),
      committedHeroToken,
      patternId,
    );
    committedHeroToken = compiled.token;
    setSteps(compiled.steps);
  }

  function countEventsThroughStepIndex(phraseSteps: readonly PhraseStep[], stepIndex: number): number {
    return phraseSteps
      .slice(0, stepIndex + 1)
      .reduce((count, step) => count + step.events.length, 0);
  }

  function resetInternal(nextToken: string = committedHeroToken): void {
    clearScene();
    rebuildTimeline(nextToken);
    placeAnchorBlock();
    phraseTime = 0;
    nextEventIndex = 0;
    holdingAtEnd = false;
    patternHandoff = null;
    wordHandoff = null;
    invalidateDerivedState();
  }

  function setState(block: BlockInstance, state: BlockState): void {
    block.state = state;
    block.stateAge = 0;
  }

  function getSortedBlocks(): readonly BlockInstance[] {
    if (!sortedBlocksCache) {
      sortedBlocksCache = [...blocks.values()].sort(
        (left, right) => left.stackIndex - right.stackIndex || left.id.localeCompare(right.id),
      );
    }
    return sortedBlocksCache;
  }

  function enterFinalHold(): void {
    clearScene();
    rebuildTimeline();

    for (const placement of compiled.blocks) {
      addBlock({
        id: placement.id,
        cellX: placement.finalX,
        cellY: placement.finalY,
        stackIndex: placement.stackIndex,
        state: "idle",
        stateAge: 0,
        visible: true,
        tone: "dark",
        renderOffsetX: 0,
        renderOffsetY: 0,
        tickerStartOffset: 0,
        tickerEndOffset: 0,
        tickerStartOffsetY: 0,
        tickerEndOffsetY: 0,
        tickerStartDelay: 0,
        tickerStageDuration: 0,
        strikeAmp: 0,
      });
    }

    phraseTime = cycleDuration;
    nextEventIndex = flattenedEvents.length;
    holdingAtEnd = true;
    patternHandoff = null;
    wordHandoff = null;
    invalidateDerivedState();
  }

  function setVisibility(block: BlockInstance, visible: boolean): void {
    if (block.visible === visible) {
      return;
    }

    if (block.visible) {
      release(block);
    }

    block.visible = visible;

    if (block.visible) {
      occupy(block);
    }
  }

  function isReadyForPatternHandoff(): boolean {
    if (patternHandoff) {
      return false;
    }

    if (!holdingAtEnd && currentStep().handoffRole !== "hold-final") {
      return false;
    }

    if (blocks.size !== compiled.blocks.length) {
      return false;
    }

    return compiled.blocks.every((placement) => {
      const block = blocks.get(placement.id);
      return block
        && block.visible
        && block.tone === "dark"
        && block.cellX === placement.finalX
        && block.cellY === placement.finalY;
    });
  }

  function beginPatternHandoff(nextPatternId: HeroWordPatternId): boolean {
    if (nextPatternId === patternId || !isReadyForPatternHandoff()) {
      return false;
    }

    const nextCompiled = compileHeroWordPattern(
      makeTypographyLayout(grid, gridScaleProfile),
      committedHeroToken,
      nextPatternId,
    );
    const bridge: PatternHandoffBridge = buildPatternHandoffBridge(compiled, nextCompiled);

    patternHandoff = {
      targetPatternId: nextPatternId,
      targetCompiled: nextCompiled,
      targetEstablishStep: bridge.targetEstablishStep,
      targetEventIndex: countEventsThroughStepIndex(nextCompiled.steps, bridge.targetEstablishStep.index),
    };

    setSteps(bridge.steps, 0);
    phraseTime = 0;
    nextEventIndex = 0;
    holdingAtEnd = false;
    invalidateDerivedState();
    return true;
  }

  function finishPatternHandoff(): void {
    const handoff = patternHandoff;
    if (!handoff) {
      return;
    }

    patternId = handoff.targetPatternId;
    compiled = handoff.targetCompiled;
    committedHeroToken = compiled.token;
    setSteps(compiled.steps);
    phraseTime = handoff.targetEstablishStep.endTime;
    nextEventIndex = handoff.targetEventIndex;
    holdingAtEnd = false;
    patternHandoff = null;
    invalidateDerivedState();
  }

  function isReadyForWordHandoff(): boolean {
    if (patternHandoff || wordHandoff) {
      return false;
    }

    if (!holdingAtEnd && currentStep().handoffRole !== "hold-final") {
      return false;
    }

    if (blocks.size !== compiled.blocks.length) {
      return false;
    }

    return compiled.blocks.every((placement) => {
      const block = blocks.get(placement.id);
      return block
        && block.visible
        && block.tone === "dark"
        && block.cellX === placement.finalX
        && block.cellY === placement.finalY;
    });
  }

  function validateWordMorphInternal(token: string): WordMorphValidation {
    const validation = validateHeroTokenInput(token);
    if (!validation.ok) {
      return { ok: false, reason: "format" };
    }
    if (validation.normalizedToken === committedHeroToken) {
      return { ok: true };
    }
    try {
      compileHeroWordPattern(
        makeTypographyLayout(grid, gridScaleProfile),
        validation.normalizedToken,
        patternId,
      );
    } catch {
      return { ok: false, reason: "compile" };
    }
    return { ok: true };
  }

  function beginWordHandoff(nextToken: string): boolean {
    const validation = validateHeroTokenInput(nextToken);
    if (!validation.ok) {
      return false;
    }
    if (validation.normalizedToken === committedHeroToken) {
      return false;
    }
    const morphCheck = validateWordMorphInternal(nextToken);
    if (!morphCheck.ok) {
      return false;
    }
    if (!isReadyForWordHandoff()) {
      return false;
    }

    const nextCompiled = compileHeroWordPattern(
      makeTypographyLayout(grid, gridScaleProfile),
      validation.normalizedToken,
      patternId,
    );

    const reducedMotion = typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let bridge: PatternHandoffBridge;
    const character = ELECTRIC_TICKER_CHARACTERS[patternId];
    try {
      bridge = reducedMotion
        ? buildWordHandoffBridge(compiled, nextCompiled)
        : buildElectricTickerHandoffBridge(
          compiled,
          nextCompiled,
          makeTypographyLayout(grid, gridScaleProfile),
          character,
          DEFAULT_ELECTRIC_PROFILE,
        );
    } catch {
      return false;
    }

    wordHandoff = {
      targetToken: nextCompiled.token,
      targetCompiled: bridge.rewrittenTargetCompiled ?? nextCompiled,
    };

    if (!reducedMotion) {
      electricTimeline = {
        chargeDur: character.chargeDuration,
        strikeDur: character.strikeDuration,
        glowDur: character.glowDuration,
        settleDur: character.settleDuration,
      };
    } else {
      electricTimeline = null;
    }

    setSteps(bridge.steps, 0);
    phraseTime = 0;
    nextEventIndex = 0;
    holdingAtEnd = false;
    invalidateDerivedState();
    return true;
  }

  function finishWordHandoff(): void {
    const handoff = wordHandoff;
    if (!handoff) {
      return;
    }

    committedHeroToken = handoff.targetToken;
    wordHandoff = null;
    electricTimeline = null;
    enterFinalHold();
  }

  function applyEvent(event: DiscreteEvent): void {
    if (event.type === "blink") {
      setState(getBlock(event.blockId), "blink");
      return;
    }

    if (event.type === "duplicate") {
      getBlock(event.sourceId);
      const existing = blocks.get(event.blockId);
      if (existing) {
        if (existing.visible) {
          throw new Error(`Duplicate target ${event.blockId} already exists.`);
        }
        existing.cellX = event.targetX;
        existing.cellY = event.targetY;
        existing.stackIndex = event.stackIndex;
        existing.tone = "dark";
        existing.renderOffsetX = 0;
        existing.renderOffsetY = 0;
        existing.tickerStartOffset = 0;
        existing.tickerEndOffset = 0;
        existing.tickerStartOffsetY = 0;
        existing.tickerEndOffsetY = 0;
        existing.tickerStartDelay = 0;
        existing.tickerStageDuration = 0;
        existing.strikeAmp = 0;
        setVisibility(existing, true);
        setState(existing, event.state ?? "duplicate_spawn");
        return;
      }

      addBlock({
        id: event.blockId,
        cellX: event.targetX,
        cellY: event.targetY,
        stackIndex: event.stackIndex,
        state: event.state ?? "duplicate_spawn",
        stateAge: 0,
        visible: true,
        tone: "dark",
        renderOffsetX: 0,
        renderOffsetY: 0,
        tickerStartOffset: 0,
        tickerEndOffset: 0,
        tickerStartOffsetY: 0,
        tickerEndOffsetY: 0,
        tickerStartDelay: 0,
        tickerStageDuration: 0,
        strikeAmp: 0,
      });
      return;
    }

    if (event.type === "move") {
      const block = getBlock(event.blockId);
      if (block.visible) {
        release(block);
      }
      block.cellX = event.targetX;
      block.cellY = event.targetY;
      if (typeof event.stackIndex === "number") {
        block.stackIndex = event.stackIndex;
      }
      if (block.visible) {
        occupy(block);
      }
      setState(block, event.state ?? "snap_move");
      return;
    }

    if (event.type === "tone") {
      event.blockIds.forEach((blockId) => {
        getBlock(blockId).tone = event.tone;
      });
      return;
    }

    if (event.type === "visibility") {
      event.blockIds.forEach((blockId) => {
        setVisibility(getBlock(blockId), event.visible);
      });
      return;
    }

    if (event.type === "ticker_scroll") {
      const startY = event.startOffsetY ?? 0;
      const endY = event.endOffsetY ?? 0;
      const perBlockDuration = event.perBlockDuration ?? BLOCK_STATE_DURATIONS.ticker_scroll;
      const nextState = event.state ?? "ticker_scroll";
      event.blockIds.forEach((blockId) => {
        const block = getBlock(blockId);
        block.tickerStartOffset = event.startOffset;
        block.tickerEndOffset = event.endOffset;
        block.tickerStartOffsetY = startY;
        block.tickerEndOffsetY = endY;
        block.tickerStartDelay = event.perBlockDelays?.get(blockId) ?? 0;
        block.tickerStageDuration = perBlockDuration;
        block.renderOffsetX = event.startOffset;
        block.renderOffsetY = startY;
        setState(block, nextState);
      });
      return;
    }

    const targets = event.blockIds
      ? event.blockIds.map((blockId) => getBlock(blockId))
      : [...blocks.values()];

    for (const block of targets) {
      setState(block, event.state ?? "stack_settle");
    }
  }

  function advanceStateAges(dt: number): void {
    for (const block of blocks.values()) {
      block.stateAge += dt;
      const stateDuration = block.state === "ticker_scroll" && block.tickerStageDuration > 0
        ? block.tickerStartDelay + block.tickerStageDuration
        : BLOCK_STATE_DURATIONS[block.state];
      if (block.state !== "idle" && block.stateAge >= stateDuration) {
        if (block.state === "ticker_scroll") {
          block.renderOffsetX = block.tickerEndOffset;
          block.renderOffsetY = block.tickerEndOffsetY;
        }
        block.state = "idle";
        block.stateAge = 0;
        continue;
      }
      if (block.state === "ticker_scroll") {
        const duration = block.tickerStageDuration > 0
          ? block.tickerStageDuration
          : BLOCK_STATE_DURATIONS.ticker_scroll;
        const effectiveAge = block.stateAge - block.tickerStartDelay;
        const phase = effectiveAge <= 0 ? 0 : Math.min(1, Math.max(0, effectiveAge / duration));
        block.renderOffsetX = block.tickerStartOffset
          + (block.tickerEndOffset - block.tickerStartOffset) * phase;
        block.renderOffsetY = block.tickerStartOffsetY
          + (block.tickerEndOffsetY - block.tickerStartOffsetY) * phase;
      }
    }
  }

  function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function updateStrikeTimeline(): void {
    if (!electricTimeline || (!wordHandoff && !holdingAtEnd)) {
      strikePhase = 0;
      strikeFlag = 0;
      flickerIntensity = 0;
      glowMix = 0;
      return;
    }
    const { chargeDur, strikeDur, glowDur, settleDur } = electricTimeline;
    const chargeEnd = chargeDur;
    const strikeEnd = chargeEnd + strikeDur;
    const glowEnd = strikeEnd + glowDur;
    const totalEnd = glowEnd + settleDur;
    const t = phraseTime;

    if (t < 0 || t >= totalEnd) {
      strikePhase = 0;
      strikeFlag = 0;
      flickerIntensity = 0;
      glowMix = 0;
      return;
    }
    if (t < chargeEnd) {
      const p = chargeDur > 0 ? t / chargeDur : 0;
      strikePhase = 0;
      strikeFlag = 0;
      flickerIntensity = smoothstep(0, 1, p) * 0.20;
      glowMix = 0;
      return;
    }
    if (t < strikeEnd) {
      const p = strikeDur > 0 ? (t - chargeEnd) / strikeDur : 0;
      strikePhase = p;
      strikeFlag = 1;
      flickerIntensity = 0.60 + Math.sin(p * Math.PI) * 0.40;
      glowMix = 0;
      return;
    }
    if (t < glowEnd) {
      const p = glowDur > 0 ? (t - strikeEnd) / glowDur : 0;
      strikePhase = 0;
      strikeFlag = 0;
      flickerIntensity = 0.60 + (0.10 - 0.60) * p;
      glowMix = Math.sin(p * Math.PI);
      return;
    }
    const p = settleDur > 0 ? (t - glowEnd) / settleDur : 0;
    strikePhase = 0;
    strikeFlag = 0;
    flickerIntensity = 0.10 * (1 - p);
    glowMix = 0.5 * (1 - p);
  }

  function applyPendingEvents(): void {
    while (
      nextEventIndex < flattenedEvents.length
      && flattenedEvents[nextEventIndex].at <= phraseTime + EPSILON
    ) {
      applyEvent(flattenedEvents[nextEventIndex]);
      nextEventIndex += 1;
    }
  }

  function currentStep(): PhraseStep {
    return steps.find((step) => phraseTime >= step.startTime && phraseTime < step.endTime)
      ?? steps[steps.length - 1];
  }

  resetInternal();

  return {
    update(dt) {
      if (dt <= 0) {
        return;
      }

      elapsedTime += dt;
      invalidateDerivedState();
      let remaining = dt;

      while (remaining > EPSILON) {
        if (patternHandoff) {
          const untilComplete = Math.max(cycleDuration - phraseTime, 0);
          const chunk = Math.min(remaining, untilComplete);
          phraseTime += chunk;
          advanceStateAges(chunk);
          applyPendingEvents();
          remaining -= chunk;

          if (phraseTime >= cycleDuration - EPSILON) {
            finishPatternHandoff();
          }
          continue;
        }

        if (wordHandoff) {
          const untilComplete = Math.max(cycleDuration - phraseTime, 0);
          const chunk = Math.min(remaining, untilComplete);
          phraseTime += chunk;
          advanceStateAges(chunk);
          applyPendingEvents();
          remaining -= chunk;

          if (phraseTime >= cycleDuration - EPSILON) {
            finishWordHandoff();
          }
          continue;
        }

        if (holdingAtEnd) {
          if (loopEnabled) {
            resetInternal();
          } else {
            return;
          }
        } else if (phraseTime >= cycleDuration - EPSILON) {
          if (loopEnabled) {
            resetInternal();
          } else {
            enterFinalHold();
            return;
          }
        }

        const untilLoop = cycleDuration - phraseTime;
        const chunk = Math.min(remaining, untilLoop);
        phraseTime += chunk;
        advanceStateAges(chunk);
        applyPendingEvents();
        remaining -= chunk;

        if (phraseTime >= cycleDuration - EPSILON) {
          if (loopEnabled) {
            if (remaining > EPSILON) {
              resetInternal();
            }
          } else {
            enterFinalHold();
            break;
          }
        }
      }

      updateStrikeTimeline();
    },
    resize(width, height) {
      const nextGrid = makeGridConfig(width, height, gridScaleProfile);
      if (
        nextGrid.cellSize === grid.cellSize
        && nextGrid.cols === grid.cols
        && nextGrid.rows === grid.rows
        && nextGrid.originX === grid.originX
        && nextGrid.originY === grid.originY
      ) {
        return;
      }

      grid = nextGrid;
      if (holdingAtEnd) {
        enterFinalHold();
        return;
      }

      resetInternal();
    },
    reset() {
      resetInternal();
    },
    zoomIn() {
      presentationZoomScale = stepPresentationZoom(presentationZoomScale, 1);
      snapshotCache = null;
    },
    zoomOut() {
      presentationZoomScale = stepPresentationZoom(presentationZoomScale, -1);
      snapshotCache = null;
    },
    resetZoomToDefault() {
      presentationZoomScale = DEFAULT_PRESENTATION_ZOOM_SCALE;
      snapshotCache = null;
    },
    startPatternHandoff(nextPatternId) {
      return beginPatternHandoff(nextPatternId);
    },
    isPatternHandoffActive() {
      return patternHandoff !== null;
    },
    startWordHandoff(token) {
      return beginWordHandoff(token);
    },
    isWordHandoffActive() {
      return wordHandoff !== null;
    },
    isAnyHandoffActive() {
      return patternHandoff !== null || wordHandoff !== null;
    },
    setHeroToken(token) {
      const validation = validateHeroTokenInput(token);
      if (!validation.ok || validation.normalizedToken === committedHeroToken) {
        return;
      }

      resetInternal(validation.normalizedToken);
    },
    setLoopEnabled(enabled) {
      loopEnabled = enabled;
      snapshotCache = null;
    },
    setPatternId(nextPatternId) {
      if (nextPatternId === patternId) {
        return;
      }

      patternId = nextPatternId;
      resetInternal();
    },
    validateHeroToken(token) {
      return validateHeroTokenInput(token);
    },
    validateWordMorph(token) {
      return validateWordMorphInternal(token);
    },
    getSnapshot() {
      if (!snapshotCache) {
        const step = currentStep();
        snapshotCache = {
          sceneName: SCENE_NAME,
          patternId,
          grid,
          heroToken: committedHeroToken,
          presentationZoomScale,
          blocks: getSortedBlocks(),
          currentStep: step,
          stepCount: steps.length,
          phraseTime,
          cycleDuration,
          loopEnabled,
          holdingAtEnd,
          time: elapsedTime,
          strikePhase,
          strikeFlag,
          flickerIntensity,
          glowMix,
        };
      }
      return snapshotCache;
    },
    destroy() {
      clearScene();
    },
  };
}
