#!/usr/bin/env node
// Machine gate for motion-study articles (docs/journal/motion-study-writing-style.md §6).
// Usage:
//   node scripts/check-motion-study-style.mjs <slug> [<slug>...]
//   node scripts/check-motion-study-style.mjs --all
// Exit 1 on any ERROR. WARNs (e.g. quantifier words) feed the manual
// reconstructability audit and never fail the run.

import { readFileSync } from "node:fs";
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

const JA_BANNED_JARGON = [
  "包絡", "エンベロープ", "正規化", "onset", "family",
  "キー時刻", "ハンドル", "schedule", "view-source",
  // 2026-06-10 additions (#4 incident — style doc §4): research-internal words
  // that slipped past the original list built from lattice-breath's rewrite.
  "棄却", "梯子", "導出", "平坦", "定常", "極値",
  "保存量", "積保存", "和保存",
];
const JA_WARN_JARGON = ["腕", "位相", "写像", "同型", "ひと粒ぶん", "初期値", "余り"];
const EN_BANNED_JARGON = ["family", "envelope", "onset"];
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
  const jaAll = jaBody + "\n" + (jaEntry?.title ?? "") + "\n" +
    (jaEntry?.summary ?? "") + "\n" + (jaEntry?.metaDescription ?? "");

  // tone: 常体のみ
  const desumasu = jaBody.match(/(です|ます|ました|ません)。/g) ?? [];
  if (desumasu.length) errors.push(`ですます ${desumasu.length} 件 (常体に統一)`);

  // audiotest
  for (const p of JA_AUDIOTEST) if (jaAll.includes(p)) errors.push(`audiotest NG: 「${p}」`);

  // jargon mapping (style doc §4)
  for (const j of JA_BANNED_JARGON) if (jaAll.includes(j)) errors.push(`ja 禁止語彙: 「${j}」 → 語彙写像表で置換`);
  for (const j of JA_WARN_JARGON) if (jaAll.includes(j)) warns.push(`ja 要注意語彙: 「${j}」 — 初出定義済みか確認`);
  for (const j of EN_BANNED_JARGON) {
    if (new RegExp(`\\b${j}\\b`, "i").test(enBody)) errors.push(`en banned jargon: "${j}"`);
  }
  if (/(^|[^a-zA-Z])f\d/.test(jaBody)) errors.push("ja f記法残存 (f10 等) → 「10 フレーム目」");

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
