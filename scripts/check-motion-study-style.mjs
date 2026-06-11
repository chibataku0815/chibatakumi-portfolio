#!/usr/bin/env node
// Machine gate for motion-study articles (docs/journal/motion-study-writing-style.md §6).
// Usage:
//   node scripts/check-motion-study-style.mjs <slug> [<slug>...]
//   node scripts/check-motion-study-style.mjs --all
// Exit 1 on any ERROR. WARNs (e.g. quantifier words) feed the manual
// reconstructability audit and never fail the run.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ja = JSON.parse(readFileSync(join(root, "apps/web/messages/ja.json"), "utf8"));
const en = JSON.parse(readFileSync(join(root, "apps/web/messages/en.json"), "utf8"));

// wave-1 hold placeholders (Theatre/boil era, pre-style, unpublished). Skipped
// under --all; still checkable by naming explicitly. Migrate before publishing.
const LEGACY_EXEMPT = new Set([
  "signal-stroke-relay",
  "staged-emphasis-payoff",
  "boiling-poster-aperture",
  "temporal-echo-residue",
]);

// slug → drawer name from the original one-sheet (ja) + plain-English label
// (en). The eyebrow IS the drawer name — research vocab there broke the
// article ↔ technique mapping for readers (2026-06-10 user report). ja column
// mirrors the rollout doc table; this map is the en source of truth.
const DRAWER_EYEBROW = {
  "lattice-breath": { ja: "増減", en: "Count growth" },
  "pulse-grid": { ja: "ランダム", en: "Random" },
  "tangency-coupled-drive": { ja: "連動", en: "Linkage" },
  "complement-tangent-pair": { ja: "反比例", en: "Inverse proportion" },
  "master-rotation-echo": { ja: "残像", en: "Afterimage" },
  "shared-hold-pulse": { ja: "対称", en: "Symmetry" },
  "whip-crawl-path-cycle": { ja: "循環", en: "Cycle" },
  "coupled-shear-rotation": { ja: "分割", en: "Split" },
  "gather-return": { ja: "一体化と分離", en: "Merge & split" },
  "velocity-seeded-overshoot": { ja: "追従", en: "Follow-through" },
  "parallax-bob": { ja: "視差", en: "Parallax" },
  "arrangement-turntable": { ja: "配置移行", en: "Arrangement" },
  "seeded-settle-jump": { ja: "時間遅延", en: "Time delay" },
  "offset-stagger-conveyor": { ja: "オフセット", en: "Offset" },
  "ring-dodge": { ja: "干渉", en: "Interference" },
  "quadrant-sign-excursion": { ja: "差", en: "Difference" },
  "ring-orbit-3d": { ja: "自動方向", en: "Auto-orient" },
  "disc-tumble-projection": { ja: "2D→3D", en: "2D→3D" },
};

const JA_BANNED_JARGON = [
  "包絡", "エンベロープ", "正規化", "onset", "family",
  "キー時刻", "ハンドル", "schedule", "view-source",
  // 2026-06-10 additions (#4 incident — style doc §4): research-internal words
  // that slipped past the original list built from lattice-breath's rewrite.
  "棄却", "梯子", "導出", "平坦", "定常", "極値",
  "保存量", "積保存", "和保存",
  // 2026-06-11 additions (second sweep — user report covered ALL four published
  // articles, not just #4; the per-incident list had let these through).
  "創発", "署名", "決定論", "タンジェンシー", "減衰",
  "帰結", "裁定", "転覆", "納品", "振幅",
  // 2026-06-11 third sweep (user: 「意味わからない文面が多いです」 on #1) —
  // the 純関数 boilerplate had survived in every summary/metaDescription and
  // 6 code comments even after the body purge. SNS 版/クリップ系の内輪参照ごと禁止。
  "純関数", "SNS 版クリップ",
];
const JA_WARN_JARGON = ["腕", "位相", "写像", "同型", "ひと粒ぶん", "初期値", "余り", "踊り場", "駆動"];
const EN_BANNED_JARGON = ["family", "envelope", "onset", "deterministic", "emergent",
  // 2026-06-11 third sweep — mirrors ja 純関数 boilerplate purge.
  "pure function"];
const JA_AUDIOTEST = [
  "という形", "という話", "ということです", "大事なのは",
  "位置づけ", "することができ", "と言えるで",
];
const QUANTIFIERS = /(のみ|だけ|すべて|1 個もない|を持たない|しか[^。]{0,12}ない)/g;
// English number words → digits so "two passes" matches ja 「2 パス」.
const EN_NUM_WORDS = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6",
  seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12",
};

const texts = (sections) => {
  const out = [];
  const walk = (n) => {
    if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === "object") Object.values(n).forEach(walk);
    else if (typeof n === "string") out.push(n);
  };
  walk(sections);
  return out;
};

const numberSet = (text, isEn) => {
  let t = text;
  if (isEn) {
    t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi,
      (w) => EN_NUM_WORDS[w.toLowerCase()]);
  }
  return new Set(t.match(/\d+(?:\.\d+)?/g) ?? []);
};

const checkSlug = (slug) => {
  const errors = [];
  const warns = [];
  const jaArt = ja.journal?.articles?.["motion-studies"]?.[slug];
  const enArt = en.journal?.articles?.["motion-studies"]?.[slug];
  const jaEntry = ja.journal?.motionStudies?.entries?.[slug];
  const enEntry = en.journal?.motionStudies?.entries?.[slug];

  if (!jaArt?.sections || !enArt?.sections) {
    return { errors: [`sections missing (ja:${!!jaArt} en:${!!enArt})`], warns };
  }
  const jaS = jaArt.sections;
  const enS = enArt.sections;

  // structure
  if (jaS.length !== enS.length) errors.push(`block count ja=${jaS.length} en=${enS.length}`);
  const jaTypes = jaS.map((b) => b.type).join(",");
  const enTypes = enS.map((b) => b.type).join(",");
  if (jaTypes !== enTypes) errors.push(`block type order differs\n    ja: ${jaTypes}\n    en: ${enTypes}`);
  if (jaS[0]?.type !== "motion-demo") errors.push("section[0] must be motion-demo (まず見せる)");
  if (jaS[jaS.length - 1]?.type !== "callout") errors.push("last section must be callout (帰属+finish)");
  if (jaS.length < 8) warns.push(`only ${jaS.length} blocks — 雛形 5 セクション + demo + callout を確認`);

  const jaBody = texts(jaS).join("\n");
  const enBody = texts(enS).join("\n");
  // metaDescription joined since 2026-06-10 — #4's first release carried
  // 保存量/積保存/棄却 in the meta only, invisible to the original scan scope.
  // eyebrow joined the same day (drawer-name rule).
  const jaAll = jaBody + "\n" + (jaEntry?.title ?? "") + "\n" +
    (jaEntry?.summary ?? "") + "\n" + (jaEntry?.metaDescription ?? "") +
    "\n" + (jaEntry?.eyebrow ?? "");
  // en got the same meta-scan extension on 2026-06-11 (second sweep found
  // "emergent"/"deterministic" living in en metaDescriptions only).
  const enAll = enBody + "\n" + (enEntry?.title ?? "") + "\n" +
    (enEntry?.summary ?? "") + "\n" + (enEntry?.metaDescription ?? "");

  // eyebrow = drawer name from the original one-sheet (rollout doc 不変条件).
  const drawer = DRAWER_EYEBROW[slug];
  if (drawer) {
    if (jaEntry?.eyebrow !== drawer.ja) {
      errors.push(`ja eyebrow 「${jaEntry?.eyebrow}」 → 原典 drawer 名「${drawer.ja}」に統一`);
    }
    if (enEntry?.eyebrow !== drawer.en) {
      errors.push(`en eyebrow "${enEntry?.eyebrow}" → drawer label "${drawer.en}"`);
    }
  } else {
    warns.push("DRAWER_EYEBROW に無い slug — drawer 記事なら対応表へ追記");
  }

  // tone: 常体のみ
  const desumasu = jaBody.match(/(です|ます|ました|ません)。/g) ?? [];
  if (desumasu.length) errors.push(`ですます ${desumasu.length} 件 (常体に統一)`);

  // audiotest
  for (const p of JA_AUDIOTEST) if (jaAll.includes(p)) errors.push(`audiotest NG: 「${p}」`);

  // jargon mapping (style doc §4)
  for (const j of JA_BANNED_JARGON) if (jaAll.includes(j)) errors.push(`ja 禁止語彙: 「${j}」 → 語彙写像表で置換`);
  for (const j of JA_WARN_JARGON) if (jaAll.includes(j)) warns.push(`ja 要注意語彙: 「${j}」 — 初出定義済みか確認`);
  for (const j of EN_BANNED_JARGON) {
    if (new RegExp(`\\b${j}\\b`, "i").test(enAll)) errors.push(`en banned jargon: "${j}"`);
  }
  if (/(^|[^a-zA-Z])f\d/.test(jaBody)) errors.push("ja f記法残存 (f10 等) → 「10 フレーム目」");

  // inline-code markup (2026-06-11 — backticks shipped RAW to readers for a
  // month because no check ever looked at the rendered surface; the renderer
  // now parses `token` into <code> chips in prose blocks only).
  // Prose: pairs must stay balanced. summary/metaDescription: plain-text
  // surfaces (listing cards, <meta>/OG tags) — no backticks at all.
  for (const [loc, secs] of [["ja", jaS], ["en", enS]]) {
    secs.forEach((b, i) => {
      if (b.type === "code") return;
      for (const s of texts(b)) {
        const ticks = (s.match(/`/g) ?? []).length;
        if (ticks % 2) errors.push(`${loc} block ${i}: バッククォート ${ticks} 個 (奇数) — \`トークン\` の対で書く`);
      }
    });
  }
  for (const [loc, entry] of [["ja", jaEntry], ["en", enEntry]]) {
    for (const k of ["summary", "metaDescription"]) {
      if ((entry?.[k] ?? "").includes("`")) {
        errors.push(`${loc} ${k} にバッククォート — listing カードと <meta> はプレーン表示 (インラインコード不可)`);
      }
    }
  }

  // attribution honorific
  const jaCallout = jaS[jaS.length - 1]?.text ?? "";
  if (/（@/.test(jaCallout) && !/さん（@/.test(jaCallout)) errors.push("callout 帰属に敬称なし → 「〜さん（@handle）」");

  // block-level style
  jaS.forEach((b, i) => {
    if (b.type === "paragraph") {
      if (b.text.length > 500) errors.push(`ja block ${i}: paragraph ${b.text.length} 字 (>500 は分割)`);
      else if (b.text.length > 220) warns.push(`ja block ${i}: paragraph ${b.text.length} 字 — 分割を検討`);
    }
    if (b.type === "heading" && (b.text.length < 6 || b.text.length > 30)) {
      warns.push(`ja block ${i}: heading ${b.text.length} 字 (目安 8–30)`);
    }
    if (b.type === "list") {
      for (const item of b.items) if (item.includes("。")) errors.push(`ja block ${i}: list 項目に「。」`);
    }
  });

  // title shape
  if (jaEntry?.title && jaEntry.title.length > 20) {
    warns.push(`title ${jaEntry.title.length} 字 — 最短の現象名指し型か再確認`);
  }

  // fact parity: every numeric literal must appear in both languages
  const jaNums = numberSet(jaBody, false);
  const enNums = numberSet(enBody, true);
  const onlyJa = [...jaNums].filter((n) => !enNums.has(n));
  const onlyEn = [...enNums].filter((n) => !jaNums.has(n));
  if (onlyJa.length) errors.push(`数値が en に無い: ${onlyJa.join(", ")}`);
  if (onlyEn.length) errors.push(`数値が ja に無い: ${onlyEn.join(", ")}`);

  // How-to-think skeleton (2026-06-11, style doc §3): the spine is the build
  // walkthrough, so at least one code block must show the skeleton (one driver
  // → derived reads). Constant COMPLETENESS is deliberately not checked (user
  // refinement: the thinking matters, not an exhaustive constant table), but
  // every number that does appear in code must trace to the vendored
  // params/verb — an untraceable constant is fabricated (or drifted).
  const jaCode = jaS.filter((b) => b.type === "code");
  if (!jaCode.length) {
    errors.push("code block なし — 組み立ての骨格コードを作り方セクションに置く (style doc §3)");
  } else {
    const vendorDir = join(root, "apps/web/src/features/journal/motion-demos/verbs");
    const vendorFiles = [`${slug}.params.ts`, `${slug}.ts`]
      .map((f) => join(vendorDir, f))
      .filter((p) => existsSync(p));
    if (!vendorFiles.length) {
      warns.push("vendored verb/params が見つからない — code 定数の突合をスキップ");
    } else {
      const vendorNums = numberSet(
        vendorFiles.map((p) => readFileSync(p, "utf8")).join("\n"),
        false,
      );
      // 0/1/2 appear structurally (indices, halves, r1/r2) — not constants.
      const STRUCTURAL = new Set(["0", "1", "2"]);
      for (const block of jaCode) {
        for (const n of numberSet(block.text, false)) {
          if (!vendorNums.has(n) && !STRUCTURAL.has(n)) {
            errors.push(`code 内の数値 ${n} が vendored params/verb に無い — 出所不明の定数`);
          }
        }
      }
    }
    // 2026-06-11 第 4 次 (style doc §3 自己完結): code が呼ぶ At 系ヘルパーは同記事の
    // code 内に定義が要る。第 3 次版は breathAt/clipAt/angleAt/radiusAt を概念のまま
    // 呼んでいて、写経しても動かなかった。cubicBezier だけは許可 (散文で npm
    // bezier-easing へ橋渡し済み)。
    const codeText = jaCode.map((b) => b.text).join("\n");
    const definedFns = new Set();
    for (const m of codeText.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) definedFns.add(m[1]);
    for (const m of codeText.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=/g)) definedFns.add(m[1]);
    const ALLOWED_EXTERNAL_FNS = new Set(["cubicBezier"]);
    const undefCalled = new Set();
    for (const m of codeText.matchAll(/\b([a-z][\w$]*At)\s*\(/g)) {
      const fn = m[1];
      if (!definedFns.has(fn) && !ALLOWED_EXTERNAL_FNS.has(fn)) undefCalled.add(fn);
    }
    for (const fn of undefCalled) {
      errors.push(`code が ${fn}() を呼ぶが同記事 code 内に定義が無い — keyAt の形で掲載する (style doc §3 自己完結)`);
    }
  }

  // quantifiers → manual reconstructability audit targets
  for (const m of jaBody.matchAll(QUANTIFIERS)) {
    const ctx = jaBody.slice(Math.max(0, m.index - 14), m.index + m[0].length + 6).replace(/\n/g, " ");
    warns.push(`断定語「${m[0]}」: …${ctx}… → 実装と突合 (監査対象)`);
  }

  return { errors, warns };
};

const args = process.argv.slice(2);
const slugs = args.includes("--all")
  ? Object.keys(ja.journal?.articles?.["motion-studies"] ?? {}).filter((s) => {
      if (LEGACY_EXEMPT.has(s)) console.log(`[skip] ${s} (legacy exempt — migrate before publishing)`);
      return !LEGACY_EXEMPT.has(s);
    })
  : args;
if (!slugs.length) {
  console.error("usage: check-motion-study-style.mjs <slug>... | --all");
  process.exit(2);
}

let failed = false;
for (const slug of slugs) {
  const { errors, warns } = checkSlug(slug);
  const status = errors.length ? "FAIL" : "PASS";
  if (errors.length) failed = true;
  console.log(`\n[${status}] ${slug}  (errors: ${errors.length}, warns: ${warns.length})`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  for (const w of warns) console.log(`  warn  ${w}`);
}
process.exit(failed ? 1 : 0);
