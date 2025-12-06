import { type SiteContent } from "./content.types";

// Single source of truth for site copy/content
export const siteContent: SiteContent = {
  hero: {
    title: { ja: "千葉 工", en: "Takumi Chiba" },
    subtitle: { ja: "領域を横断するマルチクリエイター", en: "Multi-Disciplinary Creator" },
    tagline: { ja: "コードを書く。撮る。編む。", en: "Code. Capture. Craft." },
  },
  genres: [
    {
      id: "01",
      title: "Motion",
      desc_ja: "映像・写真・編集。光と時間を操る。",
      desc_en: "Video. Photo. Edit. Controlling light and time.",
    },
    {
      id: "02",
      title: "Interactive",
      desc_ja: "設計から実装まで。動くデザインを創る。",
      desc_en: "From design to code. Building experiences that move.",
    },
    {
      id: "03",
      title: "Installation",
      desc_ja: "空間と機材。環境ごと設計する。",
      desc_en: "Space and gear. Designing the environment itself.",
    },
    {
      id: "04",
      title: "Archive",
      desc_ja: "これまでの仕事。",
      desc_en: "Work history.",
    },
    {
      id: "05",
      title: "Contact",
      desc_ja: "仕事の相談。",
      desc_en: "Get in touch.",
    },
  ],
  motion: [
    {
      title: "Business Portrait",
      body_ja: "人物の本質を捉えるポートレート撮影。照明設計から現像まで一貫して担当。",
      body_en: "Portrait sessions that capture essence. Lighting design through post-processing.",
      tags: ["Photography", "Portrait", "Lighting"],
    },
    {
      title: "Event Documentation",
      body_ja: "イベントの空気を伝えるドキュメンタリー映像。企画・撮影・編集をワンストップで。",
      body_en: "Documentary videos that convey atmosphere. Planning, shooting, editing—all in one.",
      tags: ["Video", "Documentary", "Editorial"],
    },
    {
      title: "Film Look Study",
      body_ja: "フィルムの質感を追求したカラーワーク。ハイコントラストとグレインの実験。",
      body_en: "Color work pursuing film texture. Experiments in high contrast and grain.",
      tags: ["Color Grading", "Film", "Post"],
    },
  ],
  interactive: [
    {
      title: "Portfolio Site",
      body_ja: "自身のポートフォリオ。設計・デザイン・実装・アニメーションすべてを一人で。",
      body_en: "Personal portfolio. Design, development, animation—solo.",
      tags: ["Web", "Animation", "Design"],
    },
    {
      title: "Long-term Client Work",
      body_ja: "10年続くパートナーシップ。要件定義から運用まで全工程を担当。",
      body_en: "A decade-long partnership. Handling everything from requirements to operations.",
      tags: ["Full-Stack", "Product", "Consulting"],
    },
    {
      title: "Design System",
      body_ja: "Less but better。最小限で最大の効果を生むシステム設計。",
      body_en: "Less but better. System design for maximum impact with minimum elements.",
      tags: ["Design System", "Minimalism", "UI/UX"],
    },
  ],
  installation: [
    {
      title: "Overhead Filming Rig",
      body_ja: "俯瞰撮影環境の構築。機材選定から設置、運用フローまで。",
      body_en: "Building an overhead filming setup. From gear selection to workflow.",
      tags: ["Setup", "Video", "Workflow"],
    },
    {
      title: "Mobile Capture Kit",
      body_ja: "機動性と品質を両立するモバイル撮影キット。どこでも撮れる環境を。",
      body_en: "Mobile capture kit balancing agility and quality. Ready to shoot anywhere.",
      tags: ["Mobile", "Photography", "Gear"],
    },
  ],
  archive: {
    years: [
      {
        year: 2024,
        entries: ["Portfolio Site", "Business Portrait Series", "Concurrent Editing Feature"],
      },
      {
        year: 2023,
        entries: ["Event Documentation", "Mobile Workflow", "Design System Research"],
      },
    ],
    highlight: {
      title: "A Decade of Trust",
      body_ja: "10年間続くクライアントワーク。コードも、デザインも、信頼も積み重ねてきた。",
      body_en: "A decade of client work. Code, design, and trust—built over time.",
    },
  },
  contact: {
    intro_ja: "撮影、開発、デザイン。領域を問わずご相談ください。",
    intro_en: "Shooting, development, design. Let's talk across disciplines.",
    cta_label: "Let's talk",
    cta_link: "mailto:contact@chibatakumi.studio",
  },
  seo: {
    title: "Takumi Chiba | Multi-Disciplinary Creator",
    description:
      "コードを書く。撮る。編む。フルスタックエンジニア・デザイナー・フォトグラファー・ビデオグラファー・エディターとして活動する千葉工のポートフォリオ。",
  },
  logo_notes: {
    concept:
      "「工」の字をモチーフにしたモノグラム。職人性と構造の両義性。単純な形状の中に複数の読みを持たせる。",
    stroke_color: "#ededed",
    fill_color: "transparent",
    path_hint: "単一パス。ストロークアニメーション対応。stroke-dasharray/dashoffsetでドローイング表現。",
  },
};
