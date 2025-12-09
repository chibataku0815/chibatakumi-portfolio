"use client";

/**
 * SkillSectionSkeleton
 *
 * Design Direction: "Silent Anticipation"
 * - 漆黒の中で形が浮かび上がる予兆
 * - Ghost opacity (0.08-0.12) で輪郭を示唆
 * - Amber pulse で「準備中」の合図
 *
 * Emotional Goal:
 * - ストレス → 期待感
 * - 「遅い」→ 「美しい準備中」
 * - 第1幕 "Intrigue" (0-3秒) の確保
 */

type LayoutPattern = "A" | "B" | "C";

interface SkillSectionSkeletonProps {
  pattern: LayoutPattern;
}

export function SkillSectionSkeleton({ pattern }: SkillSectionSkeletonProps) {
  return (
    <section className="skill-section-skeleton relative isolate min-h-screen overflow-visible px-6 py-24 sm:px-10">
      {/* Grid Lines (subtle) */}
      <div
        className="pointer-events-none absolute inset-0 -z-[6] mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          opacity: 0.5,
        }}
      />

      {/* Ghost Text */}
      <div
        className="ghost-skeleton pointer-events-none absolute -z-2 select-none whitespace-nowrap font-black uppercase leading-none tracking-[-0.06em]"
        style={{
          fontSize: "clamp(10rem, 25vw, 20rem)",
          color: "rgba(255,255,255,0.08)",
          mixBlendMode: "overlay",
          animation: "skeleton-pulse 2s ease-in-out infinite",
          ...(pattern === "A"
            ? { right: "-15%", top: "10%" }
            : pattern === "B"
              ? { left: "-15%", top: "15%" }
              : { left: "50%", top: "5%", transform: "translateX(-50%)" }),
        }}
      >
        SKILL
      </div>

      {/* Content Grid */}
      <div className="mx-auto max-w-7xl">
        {pattern === "A" && <SkeletonPatternA />}
        {pattern === "B" && <SkeletonPatternB />}
        {pattern === "C" && <SkeletonPatternC />}
      </div>

      {/* Rail */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center sm:w-16">
        <div
          className="absolute inset-y-24 right-0 w-px bg-white/10"
          style={{ animation: "skeleton-pulse 2s ease-in-out infinite" }}
        />
      </div>
    </section>
  );
}

// Pattern A: 右重心（黄金比）
function SkeletonPatternA() {
  return (
    <div className="grid min-h-[70vh] items-center gap-12 md:grid-cols-[1.618fr,1fr]">
      {/* Left: Content Placeholder */}
      <div className="flex flex-col gap-8">
        {/* Title */}
        <div
          className="h-16 w-3/4 rounded"
          style={{
            backgroundColor: "rgba(242, 242, 242, 0.12)",
            animation: "skeleton-pulse 2s ease-in-out infinite",
          }}
        />

        {/* Description */}
        <div className="space-y-3">
          <div
            className="h-4 w-full rounded"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              animation: "skeleton-pulse 2s ease-in-out infinite 0.1s",
            }}
          />
          <div
            className="h-4 w-5/6 rounded"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              animation: "skeleton-pulse 2s ease-in-out infinite 0.2s",
            }}
          />
          <div
            className="h-4 w-4/6 rounded"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              animation: "skeleton-pulse 2s ease-in-out infinite 0.3s",
            }}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-20 rounded-full"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                animation: `skeleton-pulse 2s ease-in-out infinite ${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Loading indicator */}
        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-2 w-2 rounded-full bg-white/20"
            style={{
              animation: "skeleton-pulse 2s ease-in-out infinite",
            }}
          />
          <div
            className="text-xs font-mono uppercase tracking-[0.2em]"
            style={{
              color: "var(--text-base-40)",
              animation: "skeleton-pulse 2s ease-in-out infinite",
            }}
          >
            Loading...
          </div>
        </div>
      </div>

      {/* Right: Image Placeholder */}
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-2xl"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          animation: "skeleton-pulse 2s ease-in-out infinite 0.5s",
        }}
      />
    </div>
  );
}

// Pattern B: 左重心（黄金比）
function SkeletonPatternB() {
  return (
    <div className="grid min-h-[70vh] items-center gap-12 md:grid-cols-[1fr,1.618fr]">
      {/* Left: Image Placeholder */}
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-2xl"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          animation: "skeleton-pulse 2s ease-in-out infinite 0.5s",
        }}
      />

      {/* Right: Content Placeholder */}
      <div className="flex flex-col gap-8">
        {/* Title */}
        <div
          className="ml-auto h-16 w-3/4 rounded"
          style={{
            backgroundColor: "rgba(242, 242, 242, 0.12)",
            animation: "skeleton-pulse 2s ease-in-out infinite",
          }}
        />

        {/* Description */}
        <div className="ml-auto w-full space-y-3">
          <div
            className="ml-auto h-4 w-full rounded"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              animation: "skeleton-pulse 2s ease-in-out infinite 0.1s",
            }}
          />
          <div
            className="ml-auto h-4 w-5/6 rounded"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              animation: "skeleton-pulse 2s ease-in-out infinite 0.2s",
            }}
          />
          <div
            className="ml-auto h-4 w-4/6 rounded"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              animation: "skeleton-pulse 2s ease-in-out infinite 0.3s",
            }}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-end gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-20 rounded-full"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                animation: `skeleton-pulse 2s ease-in-out infinite ${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Loading indicator */}
        <div className="mt-4 flex items-center justify-end gap-3">
          <div
            className="text-xs font-mono uppercase tracking-[0.2em]"
            style={{
              color: "var(--text-base-40)",
              animation: "skeleton-pulse 2s ease-in-out infinite",
            }}
          >
            Loading...
          </div>
          <div
            className="h-2 w-2 rounded-full bg-white/20"
            style={{
              animation: "skeleton-pulse 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Pattern C: 中央緊張
function SkeletonPatternC() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-12">
      {/* Title (Center) */}
      <div
        className="h-20 w-2/3 rounded"
        style={{
          backgroundColor: "rgba(242, 242, 242, 0.12)",
          animation: "skeleton-pulse 2s ease-in-out infinite",
        }}
      />

      {/* Content Grid */}
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1fr,1.618fr]">
        {/* Left: Image Placeholder */}
        <div
          className="relative aspect-square overflow-hidden rounded-2xl"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            animation: "skeleton-pulse 2s ease-in-out infinite 0.5s",
          }}
        />

        {/* Right: Content */}
        <div className="flex flex-col justify-center gap-6">
          {/* Description */}
          <div className="space-y-3">
            <div
              className="h-4 w-full rounded"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                animation: "skeleton-pulse 2s ease-in-out infinite 0.1s",
              }}
            />
            <div
              className="h-4 w-5/6 rounded"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                animation: "skeleton-pulse 2s ease-in-out infinite 0.2s",
              }}
            />
            <div
              className="h-4 w-4/6 rounded"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                animation: "skeleton-pulse 2s ease-in-out infinite 0.3s",
              }}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-20 rounded-full"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  animation: `skeleton-pulse 2s ease-in-out infinite ${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          {/* Loading indicator */}
          <div className="mt-4 flex items-center gap-3">
            <div
              className="h-2 w-2 rounded-full bg-white/20"
              style={{
                animation: "skeleton-pulse 2s ease-in-out infinite",
              }}
            />
            <div
              className="text-xs font-mono uppercase tracking-[0.2em]"
              style={{
                color: "var(--text-base-40)",
                animation: "skeleton-pulse 2s ease-in-out infinite",
              }}
            >
              Loading...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillSectionSkeleton;
