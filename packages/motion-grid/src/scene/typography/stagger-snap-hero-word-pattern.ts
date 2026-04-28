import {
  QUIET_HOLD_DURATION,
  buildCompiledTypographyPhrase,
  createHeroWordLayout,
  getGlyphBlocks,
  sortBlocksByRowAndColumn,
  withSpawnOverrides,
  type CompiledBlockPlacement,
  type CompiledTypographyPhrase,
  type StepDefinition,
  type TypographyGridLayout,
} from "./hero-word-pattern-shared";

export const STAGGER_SNAP_HERO_WORD_PATTERN_ID = "stagger-snap";

function getRowBandLabel(localRow: number): string {
  if (localRow <= 1) {
    return "Top";
  }
  if (localRow <= 3) {
    return "Mid";
  }
  return "Base";
}

function getBandBlocks(
  glyphBlocks: readonly CompiledBlockPlacement[],
  minY: number,
  bandLabel: string,
): CompiledBlockPlacement[] {
  return glyphBlocks.filter((placement) => (
    getRowBandLabel(placement.finalY - minY) === bandLabel
  ));
}

export function compileStaggerSnapHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
): CompiledTypographyPhrase {
  const layout = createHeroWordLayout(grid, token);
  const leadGlyph = layout.glyphs[0];
  if (!leadGlyph) {
    throw new Error("Stagger-snap pattern requires at least one glyph.");
  }

  const blocks = withSpawnOverrides(layout.blocks, (placement) => {
    if (placement.glyphIndex === 0) {
      return undefined;
    }

    return {
      spawnX: placement.finalX,
      spawnY: Math.min(grid.rows - 1, placement.finalY + 2),
    };
  });

  const stepDefinitions: StepDefinition[] = [
    {
      name: "Anchor Hold",
      duration: 0.58,
      handoffRole: "hold",
      events: [],
    },
    {
      name: "Lead Blink",
      duration: 0.18,
      events: [
        { type: "blink", blockId: leadGlyph.anchorId },
      ],
    },
    {
      name: "Lead Form",
      duration: 0.28,
      handoffRole: "establish",
      events: sortBlocksByRowAndColumn(getGlyphBlocks(blocks, 0))
        .filter((placement) => !placement.isAnchor)
        .map((placement) => ({
          type: "duplicate" as const,
          sourceId: leadGlyph.anchorId,
          blockId: placement.id,
          targetX: placement.finalX,
          targetY: placement.finalY,
          stackIndex: placement.stackIndex,
        })),
    },
  ];

  layout.glyphs.slice(1).forEach((glyph) => {
    const glyphBlocks = sortBlocksByRowAndColumn(getGlyphBlocks(blocks, glyph.index));
    const sourceGlyph = layout.glyphs[glyph.index - 1]!;
    const minY = Math.min(...glyphBlocks.map((placement) => placement.finalY));

    stepDefinitions.push({
      name: `Stagger ${glyph.char}`,
      duration: 0.18,
      handoffRole: "redirect",
      events: glyphBlocks.map((placement) => ({
        type: "duplicate" as const,
        sourceId: sourceGlyph.terminalId,
        blockId: placement.id,
        targetX: placement.spawnX,
        targetY: placement.spawnY,
        stackIndex: placement.stackIndex,
      })),
    });

    ["Top", "Mid", "Base"].forEach((bandLabel) => {
      stepDefinitions.push({
        name: `Snap ${glyph.char} ${bandLabel}`,
        duration: 0.10,
        handoffRole: "redirect",
        events: getBandBlocks(glyphBlocks, minY, bandLabel).map((placement) => ({
          type: "move" as const,
          blockId: placement.id,
          targetX: placement.finalX,
          targetY: placement.finalY,
        })),
      });
    });
  });

  stepDefinitions.push(
    {
      name: "Terminal Blink",
      duration: 0.16,
      events: [
        { type: "blink", blockId: leadGlyph.anchorId },
        { type: "blink", blockId: layout.glyphs[layout.glyphs.length - 1]!.terminalId },
      ],
    },
    {
      name: "Settle",
      duration: 0.28,
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
    STAGGER_SNAP_HERO_WORD_PATTERN_ID,
    layout,
    stepDefinitions,
    { blocks },
  );
}
