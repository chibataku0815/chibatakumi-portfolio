import {
  compileHeroWordPattern,
  type HeroWordPatternId,
} from "./hero-word-pattern-registry";
import type { BlockTone } from "../discrete-grid-scene";
import type {
  CompiledBlockPlacement,
  CompiledTypographyPhrase,
  TypographyGridLayout,
} from "./hero-word-pattern-shared";
import {
  findFirstStepByHandoffRole,
  simulateCompiledPhraseToStep,
} from "./hero-word-pattern-shared";
import { MAX_HERO_TOKEN_BLOCKS } from "./hero-token";

function cellKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getBlockById(
  blocks: readonly CompiledBlockPlacement[],
  blockId: string,
): CompiledBlockPlacement {
  const block = blocks.find((placement) => placement.id === blockId);
  if (!block) {
    throw new Error(`Missing block placement for ${blockId}.`);
  }
  return block;
}

export interface HeroWordPatternVerificationResult {
  readonly patternId: string;
  readonly blockCount: number;
  readonly cycleDuration: number;
  readonly stepCount: number;
}

export function verifyCompiledTypographyPhrase(
  compiled: CompiledTypographyPhrase,
): HeroWordPatternVerificationResult {
  assert(
    compiled.blocks.length <= MAX_HERO_TOKEN_BLOCKS,
    `${compiled.patternId}: block count exceeds ${MAX_HERO_TOKEN_BLOCKS}.`,
  );

  const establishStep = findFirstStepByHandoffRole(compiled, "establish");
  const redirectStep = findFirstStepByHandoffRole(compiled, "redirect");
  const settleStep = findFirstStepByHandoffRole(compiled, "settle");
  const finalHoldStep = findFirstStepByHandoffRole(compiled, "hold-final");
  assert(establishStep, `${compiled.patternId}: missing establish handoff role.`);
  assert(redirectStep, `${compiled.patternId}: missing redirect handoff role.`);
  assert(settleStep, `${compiled.patternId}: missing settle handoff role.`);
  assert(finalHoldStep, `${compiled.patternId}: missing hold-final handoff role.`);
  assert(
    establishStep.index < redirectStep.index
    && redirectStep.index < settleStep.index
    && settleStep.index < finalHoldStep.index,
    `${compiled.patternId}: handoff roles must progress establish -> redirect -> settle -> hold-final.`,
  );

  const establishState = simulateCompiledPhraseToStep(compiled, establishStep.index);
  assert(
    establishState.visibleIds.includes(compiled.leadAnchorId),
    `${compiled.patternId}: lead anchor must remain visible by establish phase.`,
  );

  const activeBlocks = new Map<string, { x: number; y: number; tone: BlockTone; visible: boolean }>();
  const occupancy = new Map<string, string>();

  function occupy(blockId: string, x: number, y: number): void {
    const key = cellKey(x, y);
    const existing = occupancy.get(key);
    assert(!existing || existing === blockId, `${compiled.patternId}: cell ${key} occupied by ${existing}.`);
    occupancy.set(key, blockId);
  }

  function release(blockId: string): void {
    const active = activeBlocks.get(blockId);
    assert(active, `${compiled.patternId}: cannot release unknown block ${blockId}.`);
    occupancy.delete(cellKey(active.x, active.y));
  }

  const leadPlacement = getBlockById(compiled.blocks, compiled.leadAnchorId);
  assert(leadPlacement.isAnchor, `${compiled.patternId}: lead anchor must be an anchor placement.`);
  activeBlocks.set(leadPlacement.id, {
    x: leadPlacement.finalX,
    y: leadPlacement.finalY,
    tone: "dark",
    visible: true,
  });
  occupy(leadPlacement.id, leadPlacement.finalX, leadPlacement.finalY);

  compiled.steps.flatMap((step) => step.events).forEach((event) => {
    if (event.type === "blink" || event.type === "settle" || event.type === "ticker_scroll") {
      return;
    }

      if (event.type === "duplicate") {
        assert(activeBlocks.has(event.sourceId), `${compiled.patternId}: duplicate source ${event.sourceId} missing.`);
        const existing = activeBlocks.get(event.blockId);
        if (existing) {
          assert(!existing.visible, `${compiled.patternId}: duplicate target ${event.blockId} already exists.`);
          existing.x = event.targetX;
          existing.y = event.targetY;
          existing.tone = "dark";
          existing.visible = true;
          occupy(event.blockId, event.targetX, event.targetY);
          return;
        }

        activeBlocks.set(event.blockId, {
          x: event.targetX,
          y: event.targetY,
          tone: "dark",
          visible: true,
        });
        occupy(event.blockId, event.targetX, event.targetY);
        return;
      }

      if (event.type === "tone") {
        event.blockIds.forEach((blockId) => {
          const active = activeBlocks.get(blockId);
          assert(active, `${compiled.patternId}: tone target ${blockId} missing.`);
          active.tone = event.tone;
        });
        return;
      }

      if (event.type === "visibility") {
        event.blockIds.forEach((blockId) => {
          const active = activeBlocks.get(blockId);
          assert(active, `${compiled.patternId}: visibility target ${blockId} missing.`);
          if (active.visible && !event.visible) {
            occupancy.delete(cellKey(active.x, active.y));
          }
          if (!active.visible && event.visible) {
            occupy(blockId, active.x, active.y);
          }
          active.visible = event.visible;
        });
        return;
      }

      const active = activeBlocks.get(event.blockId);
      assert(active, `${compiled.patternId}: move block ${event.blockId} missing.`);
      if (active.visible) {
        release(event.blockId);
      }
      active.x = event.targetX;
      active.y = event.targetY;
      if (active.visible) {
        occupy(event.blockId, event.targetX, event.targetY);
      }
    });

  assert(
    activeBlocks.size === compiled.blocks.length,
    `${compiled.patternId}: final block count ${activeBlocks.size} does not match compiled count ${compiled.blocks.length}.`,
  );

  compiled.blocks.forEach((placement) => {
    const active = activeBlocks.get(placement.id);
    assert(active, `${compiled.patternId}: missing final block ${placement.id}.`);
    assert(
      active.x === placement.finalX && active.y === placement.finalY,
      `${compiled.patternId}: block ${placement.id} did not reach final composition.`,
    );
    assert(
      active.visible,
      `${compiled.patternId}: block ${placement.id} is hidden at final composition.`,
    );
    assert(
      active.tone === "dark",
      `${compiled.patternId}: block ${placement.id} did not resolve back to dark tone.`,
    );
  });

  const uniqueFinalCells = new Set(compiled.blocks.map((placement) => cellKey(placement.finalX, placement.finalY)));
  assert(
    uniqueFinalCells.size === compiled.blocks.length,
    `${compiled.patternId}: final composition has overlapping cells.`,
  );

  return {
    patternId: compiled.patternId,
    blockCount: compiled.blocks.length,
    cycleDuration: compiled.steps.at(-1)?.endTime ?? 0,
    stepCount: compiled.steps.length,
  };
}

export function verifyHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
  patternId: HeroWordPatternId,
): HeroWordPatternVerificationResult {
  return verifyCompiledTypographyPhrase(compileHeroWordPattern(grid, token, patternId));
}
