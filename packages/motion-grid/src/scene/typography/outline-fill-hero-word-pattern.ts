import {
  QUIET_HOLD_DURATION,
  buildCompiledTypographyPhrase,
  createHeroWordLayout,
  getGlyphBlocks,
  partitionGlyphBlocksByBoundary,
  sortBlocksByRowAndColumn,
  type CompiledBlockPlacement,
  type CompiledTypographyPhrase,
  type StepDefinition,
  type TypographyGridLayout,
} from "./hero-word-pattern-shared";

export const OUTLINE_FILL_HERO_WORD_PATTERN_ID = "outline-fill";

function getSortedGlyphBlocks(
  blocks: readonly CompiledBlockPlacement[],
  glyphIndex: number,
): CompiledBlockPlacement[] {
  return sortBlocksByRowAndColumn(getGlyphBlocks(blocks, glyphIndex));
}

function buildDuplicateEvents(
  sourceId: string,
  placements: readonly CompiledBlockPlacement[],
): StepDefinition["events"] {
  return placements.map((placement) => ({
    type: "duplicate" as const,
    sourceId,
    blockId: placement.id,
    targetX: placement.finalX,
    targetY: placement.finalY,
    stackIndex: placement.stackIndex,
  }));
}

export function compileOutlineFillHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
): CompiledTypographyPhrase {
  const layout = createHeroWordLayout(grid, token);
  const leadGlyph = layout.glyphs[0];
  if (!leadGlyph) {
    throw new Error("Outline-fill pattern requires at least one glyph.");
  }

  const lastGlyph = layout.glyphs[layout.glyphs.length - 1]!;
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
      name: "Anchor Spread",
      duration: 0.24,
      handoffRole: "establish",
      events: layout.glyphs.slice(1).map((glyph) => {
        const glyphAnchor = getSortedGlyphBlocks(layout.blocks, glyph.index).find((placement) => placement.isAnchor);
        if (!glyphAnchor) {
          throw new Error(`Outline-fill pattern could not find anchor for glyph ${glyph.char}.`);
        }

        return {
          type: "duplicate" as const,
          sourceId: layout.glyphs[glyph.index - 1]!.anchorId,
          blockId: glyph.anchorId,
          targetX: glyphAnchor.finalX,
          targetY: glyphAnchor.finalY,
          stackIndex: glyphAnchor.stackIndex,
        };
      }),
    },
  ];

  layout.glyphs.forEach((glyph) => {
    const glyphBlocks = getSortedGlyphBlocks(layout.blocks, glyph.index);
    const { outlineBlocks } = partitionGlyphBlocksByBoundary(glyphBlocks);
    const outline = outlineBlocks.filter((placement) => !placement.isAnchor);

    if (outline.length === 0) {
      return;
    }

    stepDefinitions.push({
      name: `Outline ${glyph.char}`,
      duration: 0.20,
      handoffRole: "redirect",
      events: buildDuplicateEvents(glyph.anchorId, outline),
    });
  });

  layout.glyphs.forEach((glyph) => {
    const glyphBlocks = getSortedGlyphBlocks(layout.blocks, glyph.index);
    const { interiorBlocks: interior } = partitionGlyphBlocksByBoundary(glyphBlocks);

    if (interior.length === 0) {
      return;
    }

    stepDefinitions.push({
      name: `Fill ${glyph.char}`,
      duration: 0.20,
      handoffRole: "redirect",
      events: buildDuplicateEvents(glyph.anchorId, interior),
    });
  });

  stepDefinitions.push(
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
    OUTLINE_FILL_HERO_WORD_PATTERN_ID,
    layout,
    stepDefinitions,
  );
}
