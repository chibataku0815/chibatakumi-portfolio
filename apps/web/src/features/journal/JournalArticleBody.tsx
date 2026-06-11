import type {
  JournalBlock,
  JournalCalloutBlock,
  JournalCodeBlock,
  JournalHeadingBlock,
  JournalListBlock,
  JournalMotionDemoBlock,
  JournalParagraphBlock,
  JournalQuoteBlock,
} from "./article-blocks";
import { MONO_STACK, renderInlineCode } from "./inline-code";
import { JournalMotionDemo } from "./motion-demos/JournalMotionDemo";

interface JournalArticleBodyProps {
  blocks: readonly JournalBlock[];
}

export function JournalArticleBody({ blocks }: JournalArticleBodyProps) {
  return (
    <div className="mx-auto max-w-[42rem] space-y-10">
      {blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: JournalBlock }) {
  switch (block.type) {
    case "heading":
      return <Heading block={block} />;
    case "paragraph":
      return <Paragraph block={block} />;
    case "list":
      return <List block={block} />;
    case "quote":
      return <Quote block={block} />;
    case "code":
      return <Code block={block} />;
    case "callout":
      return <Callout block={block} />;
    case "divider":
      return (
        <hr
          aria-hidden="true"
          className="my-4 border-0 border-t border-[var(--text-base-20)]"
        />
      );
    case "motion-demo":
      return <MotionDemo block={block} />;
    default: {
      const exhaustive: never = block;
      void exhaustive;
      return null;
    }
  }
}

function Heading({ block }: { block: JournalHeadingBlock }) {
  if (block.level === 2) {
    return (
      <h2
        id={block.id}
        className="mt-12 text-[clamp(1.75rem,3.4vw,2.4rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-base)]"
        style={{ fontFamily: "var(--font-family-display)" }}
      >
        {block.text}
      </h2>
    );
  }
  return (
    <h3
      id={block.id}
      className="mt-8 text-[1.25rem] font-medium leading-[1.3] tracking-[-0.01em] text-[var(--text-base)]"
    >
      {block.text}
    </h3>
  );
}

function Paragraph({ block }: { block: JournalParagraphBlock }) {
  return (
    <p className="text-[1rem] leading-[1.85] text-[var(--text-base-80)]">
      {renderInlineCode(block.text)}
    </p>
  );
}

function List({ block }: { block: JournalListBlock }) {
  if (block.ordered) {
    return (
      <ol className="list-decimal space-y-2 pl-6 text-[1rem] leading-[1.85] text-[var(--text-base-80)] marker:text-[var(--text-base-50)]">
        {block.items.map((item, index) => (
          <li key={index}>{renderInlineCode(item)}</li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="list-disc space-y-2 pl-6 text-[1rem] leading-[1.85] text-[var(--text-base-80)] marker:text-[var(--text-base-50)]">
      {block.items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function Quote({ block }: { block: JournalQuoteBlock }) {
  return (
    <blockquote className="border-l border-[var(--text-base-30)] pl-6">
      <p
        className="text-[1.05rem] italic leading-[1.7] text-[var(--text-base)]"
        style={{ fontFamily: "var(--font-family-display)" }}
      >
        {renderInlineCode(block.text)}
      </p>
      {block.cite ? (
        <cite className="mt-3 block font-sans text-[10px] not-italic uppercase tracking-[0.18em] text-[var(--text-base-60)]">
          — {block.cite}
        </cite>
      ) : null}
    </blockquote>
  );
}

function Code({ block }: { block: JournalCodeBlock }) {
  return (
    <pre
      className="overflow-x-auto rounded-md border border-[var(--text-base-20)] bg-[var(--bg-secondary)] px-5 py-4 text-[0.85rem] leading-[1.6] text-[var(--text-base)]"
      style={{ fontFamily: MONO_STACK }}
    >
      <code data-lang={block.lang}>{block.text}</code>
    </pre>
  );
}

function Callout({ block }: { block: JournalCalloutBlock }) {
  const isWarn = block.tone === "warn";
  return (
    <aside
      role="note"
      className="rounded-md border border-[var(--text-base-20)] bg-[var(--bg-secondary)]/40 px-5 py-4"
    >
      <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
        {isWarn ? "Caveat" : "Note"}
      </p>
      <p className="mt-2 text-[0.95rem] leading-[1.75] text-[var(--text-base-80)]">
        {renderInlineCode(block.text)}
      </p>
    </aside>
  );
}

function MotionDemo({ block }: { block: JournalMotionDemoBlock }) {
  return <JournalMotionDemo demo={block.demo} caption={block.caption} />;
}
