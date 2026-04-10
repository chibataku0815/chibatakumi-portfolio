export type TextUnit = {
  id: string;
  index: number;
  text: string;
};

export function textUnitSplitter(source: string): TextUnit[] {
  return source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text, index) => ({
      id: `${index}-${text.toLowerCase()}`,
      index,
      text,
    }));
}
