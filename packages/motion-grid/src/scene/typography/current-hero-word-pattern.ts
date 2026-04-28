import {
  QUIET_HOLD_DURATION,
  buildCompiledTypographyPhrase,
  chooseGlyphVerticalSpawnDirection,
  createHeroWordLayout,
  getGlyphBlocks,
  withSpawnOverrides,
  type CompiledTypographyPhrase,
  type StepDefinition,
  type TypographyGridLayout,
} from "./hero-word-pattern-shared";

export const CURRENT_HERO_WORD_PATTERN_ID = "lead-chain";

export function compileLeadChainHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
): CompiledTypographyPhrase {
  const layout = createHeroWordLayout(grid, token);
  const leadGlyph = layout.glyphs[0];
  if (!leadGlyph) {
    throw new Error("Lead-chain pattern requires at least one glyph.");
  }

  const blocks = withSpawnOverrides(layout.blocks, (placement) => {
    if (placement.glyphIndex === 0 || !placement.isTerminal) {
      return undefined;
    }

    const glyphBlocks = getGlyphBlocks(layout.blocks, placement.glyphIndex);
    const direction = chooseGlyphVerticalSpawnDirection(grid, glyphBlocks);

    return {
      spawnY: placement.finalY + direction,
    };
  });

  const alignmentPlacements = blocks.filter((placement) => (
    placement.spawnX !== placement.finalX || placement.spawnY !== placement.finalY
  ));
  const lastGlyph = layout.glyphs[layout.glyphs.length - 1]!;

  const stepDefinitions: StepDefinition[] = [
    {
      name: "Anchor Hold",
      duration: 0.64,
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
      events: blocks
        .filter((placement) => placement.glyphIndex === 0 && !placement.isAnchor)
        .map((placement) => ({
          type: "duplicate" as const,
          sourceId: leadGlyph.anchorId,
          blockId: placement.id,
          targetX: placement.spawnX,
          targetY: placement.spawnY,
          stackIndex: placement.stackIndex,
        })),
    },
  ];

  layout.glyphs.slice(1).forEach((glyph) => {
    stepDefinitions.push({
      name: `Extend ${glyph.char}`,
      duration: 0.26,
      handoffRole: "redirect",
      events: blocks
        .filter((placement) => placement.glyphIndex === glyph.index)
        .map((placement) => ({
          type: "duplicate" as const,
          sourceId: glyph.sourceId,
          blockId: placement.id,
          targetX: placement.spawnX,
          targetY: placement.spawnY,
          stackIndex: placement.stackIndex,
        })),
    });
  });

  stepDefinitions.push(
    {
      name: "Alignment Snap",
      duration: 0.24,
      handoffRole: "redirect",
      events: alignmentPlacements.map((placement) => ({
        type: "move" as const,
        blockId: placement.id,
        targetX: placement.finalX,
        targetY: placement.finalY,
      })),
    },
    {
      name: "Accent Blink",
      duration: 0.16,
      events: [
        { type: "blink", blockId: leadGlyph.anchorId },
        { type: "blink", blockId: lastGlyph.terminalId },
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
    CURRENT_HERO_WORD_PATTERN_ID,
    layout,
    stepDefinitions,
  );
}

export const compileCurrentHeroWordPattern = compileLeadChainHeroWordPattern;
