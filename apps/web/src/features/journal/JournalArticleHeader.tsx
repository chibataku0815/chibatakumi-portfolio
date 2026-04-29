interface JournalArticleHeaderProps {
  eyebrow: string;
  title: string;
  summary?: string;
  publishedAt: string;
  locale: string;
  tags: readonly string[];
}

function formatPublishedAt(iso: string, locale: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function JournalArticleHeader({
  eyebrow,
  title,
  summary,
  publishedAt,
  locale,
  tags,
}: JournalArticleHeaderProps) {
  return (
    <header
      data-readability="focus"
      className="px-6 pt-32 pb-16 sm:px-12 sm:pt-44 sm:pb-24 lg:px-20"
    >
      <div className="mx-auto max-w-[42rem]">
        <p className="font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
          {eyebrow}
        </p>
        <h1
          className="mt-10 text-[clamp(2.4rem,6vw,4rem)] font-medium leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
          style={{ fontFamily: "var(--font-family-display)" }}
        >
          {title}
        </h1>
        {summary ? (
          <p className="mt-8 text-[1.15rem] leading-[1.7] text-[var(--text-muted)]">
            {summary}
          </p>
        ) : null}
        <dl className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
          <div className="flex items-baseline gap-2">
            <dt className="text-[var(--text-base-50)]">Published</dt>
            <dd className="text-[var(--text-base)] tabular-nums">
              {formatPublishedAt(publishedAt, locale)}
            </dd>
          </div>
          {tags.length ? (
            <div className="flex items-baseline gap-2">
              <dt className="text-[var(--text-base-50)]">Topics</dt>
              <dd className="text-[var(--text-base)]">
                {tags.join(" · ")}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </header>
  );
}
