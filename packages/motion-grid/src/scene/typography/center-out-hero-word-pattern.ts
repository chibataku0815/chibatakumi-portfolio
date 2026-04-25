import {
  QUIET_HOLD_DURATION,
  buildBilateralGlyphOrder,
  buildCompiledTypographyPhrase,
  createHeroWordLayout,
  getCenterLeadGlyphIndex,
  getGlyphBlocks,
  sortBlocksByRowAndColumn,
  type CompiledTypographyPhrase,
  type StepDefinition,
  type TypographyGridLayout,
} from "./hero-word-pattern-shared";

export const CENTER_OUT_HERO_WORD_PATTERN_ID = "center-out";

export function compileCenterOutHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
): CompiledTypographyPhrase {
  const layout = createHeroWordLayout(grid, token);
  const leadGlyphIndex = getCenterLeadGlyphIndex(layout.glyphs.length);
  const leadGlyph = layout.glyphs[leadGlyphIndex];
  if (!leadGlyph) {
    throw new Error("Center-out pattern requires at least one glyph.");
  }

  const order = buildBilateralGlyphOrder(layout.glyphs.length, leadGlyphIndex);
  const stepDefinitions: StepDefinition[] = [
    {
      name: "Anchor Hold",
      duration: 0.62,
      handoffRole: "hold",
      events: [],
    },
    {
      name: "Center Blink",
      duration: 0.18,
      events: [
        { type: "blink", blockId: leadGlyph.anchorId },
      ],
    },
    {
      name: "Center Form",
      duration: 0.28,
      handoffRole: "establish",
      events: sortBlocksByRowAndColumn(getGlyphBlocks(layout.blocks, leadGlyph.index))
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

  order.slice(1).forEach((glyphIndex) => {
    const glyph = layout.glyphs[glyphIndex]!;
    const sourceGlyph = glyphIndex < leadGlyphIndex
      ? layout.glyphs[glyphIndex + 1]!
      : layout.glyphs[glyphIndex - 1]!;
    const directionLabel = glyphIndex < leadGlyphIndex ? "Left" : "Right";

    stepDefinitions.push({
      name: `Expand ${directionLabel} ${glyph.char}`,
      duration: 0.24,
      handoffRole: "redirect",
      events: sortBlocksByRowAndColumn(getGlyphBlocks(layout.blocks, glyph.index))
        .map((placement) => ({
          type: "duplicate" as const,
          sourceId: sourceGlyph.anchorId,
          blockId: placement.id,
          targetX: placement.finalX,
          targetY: placement.finalY,
          stackIndex: placement.stackIndex,
        })),
    });
  });

  stepDefinitions.push(
    {
      name: "Outer Edge Blink",
      duration: 0.16,
      events: [
        { type: "blink", blockId: layout.glyphs[0]!.anchorId },
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
    CENTER_OUT_HERO_WORD_PATTERN_ID,
    layout,
    stepDefinitions,
    { leadAnchorId: leadGlyph.anchorId },
  );
}
