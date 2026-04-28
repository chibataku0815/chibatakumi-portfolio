import {
  QUIET_HOLD_DURATION,
  buildBilateralGlyphOrder,
  buildCompiledTypographyPhrase,
  buildGlyphHorizontalOvershootOffsets,
  createHeroWordLayout,
  getBlockById,
  getCenterLeadGlyphIndex,
  getGlyphBlocks,
  sortBlocksByRowAndColumn,
  withSpawnOverrides,
  type CompiledBlockPlacement,
  type CompiledTypographyPhrase,
  type StepDefinition,
  type TypographyGridLayout,
} from "./hero-word-pattern-shared";

export const OVERSHOOT_COMPRESS_HERO_WORD_PATTERN_ID = "overshoot-compress";

function buildHorizontalMoveEvents(
  blocks: readonly CompiledBlockPlacement[],
  resolveCurrentX: (placement: CompiledBlockPlacement) => number,
  resolveTargetX: (placement: CompiledBlockPlacement) => number,
) {
  const movingBlocks = blocks.filter((placement) => resolveCurrentX(placement) !== resolveTargetX(placement));
  const movingRight = movingBlocks
    .filter((placement) => resolveTargetX(placement) > resolveCurrentX(placement))
    .sort((left, right) => (
      resolveCurrentX(right) - resolveCurrentX(left)
      || left.finalY - right.finalY
      || left.id.localeCompare(right.id)
    ));
  const movingLeft = movingBlocks
    .filter((placement) => resolveTargetX(placement) < resolveCurrentX(placement))
    .sort((left, right) => (
      resolveCurrentX(left) - resolveCurrentX(right)
      || left.finalY - right.finalY
      || left.id.localeCompare(right.id)
    ));

  return [...movingRight, ...movingLeft].map((placement) => ({
    type: "move" as const,
    blockId: placement.id,
    targetX: resolveTargetX(placement),
    targetY: placement.finalY,
  }));
}

function getIntermediateX(placement: CompiledBlockPlacement): number {
  const offset = placement.spawnX - placement.finalX;
  if (offset === 0) {
    return placement.finalX;
  }

  return placement.finalX + Math.sign(offset) * Math.max(Math.abs(offset) - 1, 0);
}

export function compileOvershootCompressHeroWordPattern(
  grid: TypographyGridLayout,
  token: string,
): CompiledTypographyPhrase {
  const layout = createHeroWordLayout(grid, token);
  const leadGlyphIndex = getCenterLeadGlyphIndex(layout.glyphs.length);
  const leadGlyph = layout.glyphs[leadGlyphIndex];
  if (!leadGlyph) {
    throw new Error("Overshoot-compress pattern requires at least one glyph.");
  }

  const overshootOffsets = buildGlyphHorizontalOvershootOffsets(grid, layout.glyphs, layout.blocks);
  const blocks = withSpawnOverrides(layout.blocks, (placement) => {
    const offset = overshootOffsets[placement.glyphIndex] ?? 0;
    if (offset === 0) {
      return undefined;
    }

    return {
      spawnX: placement.finalX + offset,
    };
  });

  const order = buildBilateralGlyphOrder(layout.glyphs.length, leadGlyphIndex);
  const leadAnchorBlock = getBlockById(blocks, leadGlyph.anchorId);
  const stepDefinitions: StepDefinition[] = [
    {
      name: "Anchor Hold",
      duration: 0.56,
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
      name: "Anchor Stretch",
      duration: 0.22,
      handoffRole: "establish",
      events: [
        ...(leadAnchorBlock.spawnX !== leadAnchorBlock.finalX
          ? [{
              type: "move" as const,
              blockId: leadGlyph.anchorId,
              targetX: leadAnchorBlock.spawnX,
              targetY: leadAnchorBlock.finalY,
            }]
          : []),
        ...order.slice(1).map((glyphIndex) => {
          const glyph = layout.glyphs[glyphIndex]!;
          const sourceGlyph = glyphIndex < leadGlyphIndex
            ? layout.glyphs[glyphIndex + 1]!
            : layout.glyphs[glyphIndex - 1]!;
          const anchorBlock = getBlockById(blocks, glyph.anchorId);

          return {
            type: "duplicate" as const,
            sourceId: sourceGlyph.anchorId,
            blockId: glyph.anchorId,
            targetX: anchorBlock.spawnX,
            targetY: anchorBlock.finalY,
            stackIndex: anchorBlock.stackIndex,
          };
        }),
      ],
    },
  ];

  order.forEach((glyphIndex) => {
    const glyph = layout.glyphs[glyphIndex]!;
    const glyphBlocks = sortBlocksByRowAndColumn(getGlyphBlocks(blocks, glyph.index))
      .filter((placement) => !placement.isAnchor);

    stepDefinitions.push({
      name: `Build ${glyph.char}`,
      duration: 0.20,
      handoffRole: "redirect",
      events: glyphBlocks.map((placement) => ({
        type: "duplicate" as const,
        sourceId: glyph.anchorId,
        blockId: placement.id,
        targetX: placement.spawnX,
        targetY: placement.spawnY,
        stackIndex: placement.stackIndex,
      })),
    });
  });

  stepDefinitions.push(
    {
      name: "Compression Stage",
      duration: 0.18,
      handoffRole: "redirect",
      events: buildHorizontalMoveEvents(
        blocks,
        (placement) => placement.spawnX,
        (placement) => getIntermediateX(placement),
      ),
    },
    {
      name: "Final Lock",
      duration: 0.14,
      handoffRole: "settle",
      events: buildHorizontalMoveEvents(
        blocks,
        (placement) => getIntermediateX(placement),
        (placement) => placement.finalX,
      ),
    },
    {
      name: "Edge Accent",
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
    OVERSHOOT_COMPRESS_HERO_WORD_PATTERN_ID,
    layout,
    stepDefinitions,
    {
      blocks,
      leadAnchorId: leadGlyph.anchorId,
    },
  );
}
