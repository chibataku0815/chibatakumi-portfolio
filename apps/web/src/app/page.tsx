import { HeroText } from "@/features/hero/components";
import { SpotlightGallery, HorizontalWorks } from "@/features/works";
import Link from "next/link";

const genres = [
  {
    href: "/motion",
    tag: "01",
    title: "Motion",
    desc: "Kinetic typography, scroll animations, and visual storytelling.",
  },
  {
    href: "/interactive",
    tag: "02",
    title: "Interactive",
    desc: "Web experiences with real-time feedback and user engagement.",
  },
  {
    href: "/installation",
    tag: "03",
    title: "Installation",
    desc: "Physical-digital hybrid works and spatial computing.",
  },
  {
    href: "/archive",
    tag: "04",
    title: "Archive",
    desc: "A chronological collection of past projects and experiments.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative">
        <HeroText />
      </section>

      {/* Genre Cards */}
      <section className="relative bg-[var(--bg-dark)] px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {genres.map((genre) => (
            <Link
              key={genre.href}
              href={genre.href}
              data-transition="true"
              className="group flex flex-col gap-4 rounded-lg bg-white/[0.02] p-6 transition-all duration-300 hover:bg-white/[0.05] hover:-translate-y-1"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent-amber1)]/50">
                {genre.tag}
              </span>
              <h3 className="text-xl font-semibold tracking-tight text-[var(--text-base)]">
                {genre.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {genre.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Spotlight Gallery Section */}
      <SpotlightGallery />

      {/* Transition Spacer */}
      <section className="relative bg-[var(--bg-darker)] px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg leading-relaxed text-[var(--text-muted)]">
            Scroll to explore featured works
          </p>
        </div>
      </section>

      {/* Horizontal Works Section */}
      <HorizontalWorks />

      {/* Footer spacer */}
      <section className="h-[50vh] bg-[var(--bg-darker)]" />
    </main>
  );
}
