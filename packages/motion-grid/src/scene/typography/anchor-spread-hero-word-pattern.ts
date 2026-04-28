import {
  QUIET_HOLD_DURATION,
  buildCompiledTypographyPhrase,
  createHeroWordLayout,
  getBlockById,
  getGlyphBlocks,
  sortBlocksByRowAndColumn,
  type CompiledTypographyPhrase,
  type StepDefinition,
  type TypographyGridLayout,
} from "./hero-word-pattern-shared";

export const ANCHOR_SPREAD_HERO_WORD_PATTERN_ID = "anchor-spread";

export function compileAnchorSpreadHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
): CompiledTypographyPhrase {
  const layout = createHeroWordLayout(grid, token);
  const leadGlyph = layout.glyphs[0];
  if (!leadGlyph) {
    throw new Error("Anchor-spread pattern requires at least one glyph.");
  }

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
        const anchorBlock = getBlockById(layout.blocks, glyph.anchorId);
        const sourceGlyph = layout.glyphs[glyph.index - 1]!;

        return {
          type: "duplicate" as const,
          sourceId: sourceGlyph.anchorId,
          blockId: glyph.anchorId,
          targetX: anchorBlock.finalX,
          targetY: anchorBlock.finalY,
          stackIndex: anchorBlock.stackIndex,
        };
      }),
    },
    {
      name: "Anchor Accent",
      duration: 0.16,
      events: layout.glyphs.map((glyph) => ({
        type: "blink" as const,
        blockId: glyph.anchorId,
      })),
    },
  ];

  layout.glyphs.forEach((glyph) => {
    stepDefinitions.push({
      name: `Fill ${glyph.char}`,
      duration: 0.22,
      handoffRole: "redirect",
      events: sortBlocksByRowAndColumn(getGlyphBlocks(layout.blocks, glyph.index))
        .filter((placement) => !placement.isAnchor)
        .map((placement) => ({
          type: "duplicate" as const,
          sourceId: glyph.anchorId,
          blockId: placement.id,
          targetX: placement.finalX,
          targetY: placement.finalY,
          stackIndex: placement.stackIndex,
        })),
    });
  });

  stepDefinitions.push(
    {
      name: "Anchor Return",
      duration: 0.16,
      events: [
        { type: "blink", blockId: leadGlyph.anchorId },
        { type: "blink", blockId: layout.glyphs[layout.glyphs.length - 1]!.anchorId },
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
    ANCHOR_SPREAD_HERO_WORD_PATTERN_ID,
    layout,
    stepDefinitions,
  );
}
