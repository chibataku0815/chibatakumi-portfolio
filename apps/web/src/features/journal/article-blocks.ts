export type JournalHeadingBlock = {
  type: "heading";
  level: 2 | 3;
  text: string;
  id?: string;
};

export type JournalParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type JournalListBlock = {
  type: "list";
  ordered?: boolean;
  items: readonly string[];
};

export type JournalQuoteBlock = {
  type: "quote";
  text: string;
  cite?: string;
};

export type JournalCodeBlock = {
  type: "code";
  lang?: string;
  text: string;
};

export type JournalCalloutBlock = {
  type: "callout";
  tone: "note" | "warn";
  text: string;
};

export type JournalDividerBlock = {
  type: "divider";
};

export type JournalBlock =
  | JournalHeadingBlock
  | JournalParagraphBlock
  | JournalListBlock
  | JournalQuoteBlock
  | JournalCodeBlock
  | JournalCalloutBlock
  | JournalDividerBlock;

const VALID_TYPES: ReadonlySet<JournalBlock["type"]> = new Set([
  "heading",
  "paragraph",
  "list",
  "quote",
  "code",
  "callout",
  "divider",
]);

export function isJournalBlock(value: unknown): value is JournalBlock {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { type?: unknown };
  if (typeof candidate.type !== "string") return false;
  return VALID_TYPES.has(candidate.type as JournalBlock["type"]);
}

export function coerceJournalBlocks(value: unknown): readonly JournalBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJournalBlock);
}
