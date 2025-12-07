// =============================================================================
// Portfolio Data - 型定義 + 実データ集約
// =============================================================================

// === Base Types ===

/** メディアタイプ: 画像またはグラデーション */
export type Media =
  | { type: "image"; src: string; alt: string }
  | { type: "gradient"; value: string };

/** ナビゲーションリンク */
export interface NavLink {
  href: string;
  label: string;
}

/** ロゴ設定（ストロークアニメーション用） */
export interface LogoConfig {
  viewBox: string;
  width: number;
  height: number;
  /** 単一パスに結合してgetTotalLength()対応 */
  paths: string[];
}

// === Work Items ===

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  meta: string;
  media?: Media;
}

export interface MotionShowcase {
  id: string;
  title: string;
  description: string;
  tags: string[];
  media?: Media;
}

export interface InteractiveCard {
  title: string;
  description: string;
  tags: string[];
  media?: Media;
}

export interface InstallationMeta {
  label: string;
  value: string;
}

export interface ArchiveItem {
  year: string;
  title: string;
  category: string;
  href?: string;
}

// === Page Content Types ===

export interface SiteConfig {
  title: string;
  description: string;
  siteUrl: string;
  locale: "ja" | "en";
  author: {
    name: string;
    email: string;
    role: string;
  };
}

export interface BrandingConfig {
  navBrand: string;
  logo: LogoConfig;
}

export interface NavigationConfig {
  links: NavLink[];
}

export interface HeroContent {
  title: string;
  tagline: string | { lines: string[] };
  scrollText: string;
  subTagline?: string;
}

export interface WorksSection {
  items: WorkItem[];
}

export interface SpotlightContent {
  images: Array<{ src: string; alt: string }>;
  coverImage: { src: string; alt: string };
  introText: string;
  outroText: string;
}

export interface MotionPageContent {
  label: string;
  title: string;
  showcases: MotionShowcase[];
}

export interface InteractivePageContent {
  label: string;
  title: string;
  cards: InteractiveCard[];
}

export interface InstallationPageContent {
  label: string;
  title: string;
  description: string;
  meta: InstallationMeta[];
  media?: Media;
}

export interface ArchivePageContent {
  title: string;
  items: ArchiveItem[];
}

export interface ContactPageContent {
  title: string;
  description: string;
  email: string;
  cta: string;
  responseNote?: string;
}

export interface ProfileStrength {
  id: string;
  title: string;
  description: string;
  keywords: string[];
}

export interface ProfileExperience {
  id: string;
  period: string;
  type: string;
  role: string;
  description: string;
  achievements: string[];
  techStack: string[];
  teamSize?: string;
}

export interface ProfileTechCategory {
  category: string;
  items: Array<{
    name: string;
    level: "primary" | "secondary";
    context?: string;
  }>;
}

export interface ProfilePageContent {
  header: {
    title: string;
    subtitle: string;
  };
  strengths: ProfileStrength[];
  experience: ProfileExperience[];
  techStack: ProfileTechCategory[];
  cta: {
    headline: string;
    subtext: string;
    buttonLabel: string;
  };
}

// === Root Portfolio Data ===

export interface PortfolioData {
  site: SiteConfig;
  branding: BrandingConfig;
  navigation: NavigationConfig;
  hero: HeroContent;
  works: WorksSection;
  spotlight: SpotlightContent;
  pages: {
    motion: MotionPageContent;
    interactive: InteractivePageContent;
    installation: InstallationPageContent;
    archive: ArchivePageContent;
    contact: ContactPageContent;
    profile: ProfilePageContent;
  };
}

// =============================================================================
// 実データ（プレースホルダー → ユーザー提供データで差し替え）
// =============================================================================

export const portfolioData: PortfolioData = {
  // ---------------------------------------------------------------------------
  // Site Configuration
  // ---------------------------------------------------------------------------
  site: {
    title: "Takumi Chiba - Portfolio",
    description: "Creative developer portfolio",
    siteUrl: "https://takumichiba.com",
    locale: "ja",
    author: {
      name: "Takumi Chiba",
      email: "hello@takumichiba.com",
      role: "Software Engineer",
    },
  },

  // ---------------------------------------------------------------------------
  // Branding
  // ---------------------------------------------------------------------------
  branding: {
    navBrand: "TC",
    logo: {
      viewBox: "0 0 80 80",
      width: 80,
      height: 80,
      // Abstract "TC" monoline mark - 後で差し替え可能
      paths: ["M16 20 L64 20 M40 20 L40 60 M20 60 L60 60 M20 40 L35 40"],
    },
  },

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  navigation: {
    links: [
      { href: "/", label: "Index" },
      { href: "/archive", label: "Archive" },
      { href: "/profile", label: "Profile" },
      { href: "/contact", label: "Contact" },
    ],
  },

  // ---------------------------------------------------------------------------
  // Hero
  // ---------------------------------------------------------------------------
  hero: {
    title: "Takumi Chiba",
    tagline: {
      lines: ["Code.", "Capture.", "Craft."],
    },
    subTagline: "One point of view. One integrated output.",
    scrollText: "Scroll",
  },

  // ---------------------------------------------------------------------------
  // Horizontal Works
  // ---------------------------------------------------------------------------
  works: {
    items: [
      {
        id: "01",
        title: "Digital Experiences",
        description:
          "Design and code in one head. Ship the exact vision without translation loss.",
        meta: "Web Development",
      },
      {
        id: "02",
        title: "Creative Engineering",
        description:
          "Start where others say it's impossible. Push constraints until ideas ship.",
        meta: "Technical Direction",
      },
      {
        id: "03",
        title: "Design Systems",
        description:
          "Keep every touchpoint speaking the same voice — photo, film, and web aligned.",
        meta: "Design Systems",
      },
      {
        id: "04",
        title: "Motion & Interaction",
        description:
          "Where stills come alive. Designing experiences where code, image, and sound cross.",
        meta: "Experience Design",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Spotlight Gallery
  // ---------------------------------------------------------------------------
  spotlight: {
    images: [
      { src: "/spotlight/img_1.jpg", alt: "Project 1" },
      { src: "/spotlight/img_2.jpg", alt: "Project 2" },
      { src: "/spotlight/img_3.jpg", alt: "Project 3" },
      { src: "/spotlight/img_4.jpg", alt: "Project 4" },
      { src: "/spotlight/img_5.jpg", alt: "Project 5" },
      { src: "/spotlight/img_6.jpg", alt: "Project 6" },
      { src: "/spotlight/img_7.jpg", alt: "Project 7" },
      { src: "/spotlight/img_8.jpg", alt: "Project 8" },
      { src: "/spotlight/img_9.jpg", alt: "Project 9" },
      { src: "/spotlight/img_10.jpg", alt: "Project 10" },
      { src: "/spotlight/img_11.jpg", alt: "Project 11" },
      { src: "/spotlight/img_12.jpg", alt: "Project 12" },
      { src: "/spotlight/img_13.jpg", alt: "Project 13" },
      { src: "/spotlight/img_14.jpg", alt: "Project 14" },
      { src: "/spotlight/img_15.jpg", alt: "Project 15" },
      { src: "/spotlight/img_16.jpg", alt: "Project 16" },
      { src: "/spotlight/img_17.jpg", alt: "Project 17" },
      { src: "/spotlight/img_18.jpg", alt: "Project 18" },
      { src: "/spotlight/img_19.jpg", alt: "Project 19" },
      { src: "/spotlight/img_20.jpg", alt: "Project 20" },
    ],
    coverImage: { src: "/spotlight/spotlight_cover.jpg", alt: "Cover" },
    introText: "Selected Works & Creative Explorations",
    outroText: "Building Digital Experiences",
  },

  // ---------------------------------------------------------------------------
  // Pages
  // ---------------------------------------------------------------------------
  pages: {
    // Motion Page
    motion: {
      label: "Motion Design",
      title: "Movement with Meaning",
      showcases: [
        {
          id: "01",
          title: "Kinetic Typography",
          description:
            "Text that moves with purpose. Using GSAP and ScrollTrigger to create narrative-driven typographic experiences that respond to user interaction.",
          tags: ["GSAP", "ScrollTrigger", "Typography"],
        },
        {
          id: "02",
          title: "Scroll Narratives",
          description:
            "Transforming scroll into a storytelling device. Each pixel of scroll becomes a frame in a larger visual narrative.",
          tags: ["Parallax", "Scrub", "Narrative"],
        },
        {
          id: "03",
          title: "Micro-interactions",
          description:
            "Subtle animations that respond to user input, providing feedback and delight in equal measure.",
          tags: ["Hover", "Feedback", "Delight"],
        },
      ],
    },

    // Interactive Page
    interactive: {
      label: "Interactive",
      title: "Beyond Static",
      cards: [
        {
          title: "WebGL Experiences",
          description:
            "GPU-accelerated visuals with Three.js and custom GLSL shaders that push the boundaries of browser-based graphics.",
          tags: ["Three.js", "GLSL", "WebGL"],
        },
        {
          title: "Data Visualization",
          description:
            "Interactive charts and graphs that make complex data accessible and engaging through thoughtful design.",
          tags: ["D3.js", "Canvas", "SVG"],
        },
        {
          title: "Generative Art",
          description:
            "Algorithm-driven visuals that create unique, ever-changing compositions through code.",
          tags: ["Noise", "Procedural", "Real-time"],
        },
      ],
    },

    // Installation Page
    installation: {
      label: "Installation",
      title: "Physical Digital",
      description:
        "Bridging the gap between screen and space. These works explore how digital systems can inhabit physical environments, creating experiences that engage the body as much as the eye.",
      meta: [
        { label: "Medium", value: "Projection, Sensors, Custom Software" },
        { label: "Context", value: "Galleries, Public Spaces" },
      ],
    },

    // Archive Page
    archive: {
      title: "Archive",
      items: [
        { year: "2024", title: "Kinetic Brand System", category: "Motion" },
        { year: "2024", title: "Data Sculpture", category: "Installation" },
        {
          year: "2023",
          title: "Generative Poster Series",
          category: "Interactive",
        },
        { year: "2023", title: "Sound Reactive Visuals", category: "Motion" },
        {
          year: "2022",
          title: "Wayfinding Experience",
          category: "Installation",
        },
        { year: "2022", title: "Editorial Animations", category: "Motion" },
      ],
    },

    // Contact Page
    contact: {
      title: "対話を始める",
      description: `案件が具体化したときも、まだアイデア段階でも。
売り込みはしません。ビジョンを教えてください。`,
      email: "hello@takumichiba.com",
      cta: "メールを送る",
      responseNote: "返信は48時間以内に。",
    },
    profile: {
      header: {
        title: "Experience & Skills",
        subtitle:
          "デザインとフロントエンド開発を軸に、映像・写真まで一貫して手がける統合型クリエイター",
      },
      strengths: [
        {
          id: "design-engineering",
          title: "デザイン × エンジニアリング",
          description:
            "UIデザインから実装まで一貫して担当。デザイナーとエンジニアの間に生じる「翻訳ロス」をゼロに。Figmaでの設計からNext.js実装まで、同じ頭で考える。",
          keywords: ["Figma", "React", "Next.js", "デザインシステム"],
        },
        {
          id: "enterprise-quality",
          title: "エンタープライズ品質",
          description:
            "大手金融・保険企業でのシステム開発経験。72名規模の開発チームでの協働、5層クリーンアーキテクチャの設計・導入実績。",
          keywords: ["クリーンアーキテクチャ", "CQRS", "AWS", "TypeScript"],
        },
        {
          id: "visual-technology",
          title: "ビジュアル × テクノロジー",
          description:
            "写真・映像制作の経験がWeb体験設計に直結。撮影現場での判断が、そのままコードに落ちる。S-Log撮影からカラーグレーディング、WebGL表現まで。",
          keywords: ["Photography", "Videography", "Three.js", "GSAP"],
        },
      ],
      experience: [
        {
          id: "exp-1",
          period: "2025.05 - 現在",
          type: "Enterprise DX",
          role: "フルスタックエンジニア / リードエンジニア",
          description:
            "大手SIerでのAmazon Connect統合問合せ管理システム開発。5層クリーンアーキテクチャの設計・導入、QuickSightダッシュボード開発を主導。",
          achievements: [
            "5層クリーンアーキテクチャ（UI/State/Service/Query-Command/DB）の設計・導入",
            "CQRSパターンによるクエリ最適化",
            "Playwright E2Eテスト・品質ゲート構築",
          ],
          techStack: [
            "Next.js 15",
            "TypeScript",
            "Drizzle ORM",
            "PostgreSQL",
            "AWS Connect",
            "QuickSight",
          ],
          teamSize: "小規模チーム",
        },
        {
          id: "exp-2",
          period: "2024.12 - 2025.03",
          type: "損害保険システム開発",
          role: "フロントエンド / バックエンドエンジニア",
          description:
            "大手金融グループの損害保険事案管理システム開発。LINE連携チャットベースコミュニケーション機能の実装を担当。",
          achievements: [
            "保険事故事案の登録・管理機能開発",
            "REST API設計・開発",
            "72名規模チームでの協働経験",
          ],
          techStack: ["Next.js 13", "TypeScript", "Nest.js", "Prisma", "MySQL"],
          teamSize: "72名",
        },
        {
          id: "exp-3",
          period: "2022.05 - 2024.12",
          type: "SaaSプロダクト開発",
          role: "フロントエンドリード",
          description:
            "ノーコード・ローコードサービスのフロントエンド開発をリード。技術選定からアーキテクチャ設計、ステークホルダー対応まで担当。",
          achievements: [
            "2年8ヶ月の継続的な開発・保守",
            "フォームクリエーター管理画面の設計・実装",
            "生成AIプラグイン for kintone 開発",
          ],
          techStack: [
            "Remix",
            "React",
            "TypeScript",
            "DynamoDB",
            "Cognito",
          ],
          teamSize: "8-15名",
        },
        {
          id: "exp-4",
          period: "2015.04 - 2022.12",
          type: "新規事業開発・デザイン",
          role: "フロントエンド / デザイナー",
          description:
            "介護経営支援プラットフォームの新規事業開発。フロントエンド実装からサイトデザイン、ロゴ制作、UI設計まで一貫して担当。",
          achievements: [
            "7年9ヶ月の長期継続案件",
            "新規事業サイトのデザイン〜フロントエンド一貫担当",
            "デザイナー向け設計共有・育成",
          ],
          techStack: ["Vue.js", "SCSS/BEM", "Figma", "Adobe XD", "Illustrator"],
          teamSize: "20名",
        },
        {
          id: "exp-5",
          period: "2018.05 - 2024.12",
          type: "受託開発（自社）",
          role: "代表 / フルスタックエンジニア",
          description:
            "技術選定からデザイン・構築まで一貫して担当。複数クライアントへの技術コンサルティング、アーキテクチャ設計を提供。",
          achievements: [
            "要件定義〜運用保守まで全フェーズ対応",
            "Firebase/Supabaseを活用したスピード開発",
            "6年8ヶ月の事業運営",
          ],
          techStack: ["Next.js", "Remix", "Firebase", "Supabase", "Figma"],
        },
      ],
      techStack: [
        {
          category: "Frontend",
          items: [
            { name: "TypeScript", level: "primary", context: "6年" },
            { name: "React / Next.js", level: "primary", context: "5年" },
            { name: "Vue / Nuxt.js", level: "secondary", context: "3年" },
            { name: "Tailwind CSS", level: "primary" },
            { name: "GSAP / Framer Motion", level: "primary" },
            { name: "Three.js / WebGL", level: "secondary" },
          ],
        },
        {
          category: "Backend & Cloud",
          items: [
            { name: "Node.js", level: "primary" },
            { name: "AWS (Connect, QuickSight, Athena, S3)", level: "primary" },
            { name: "Firebase / Supabase", level: "primary" },
            { name: "PostgreSQL / MySQL", level: "secondary" },
            { name: "Drizzle ORM / Prisma", level: "secondary" },
          ],
        },
        {
          category: "Design & Creative",
          items: [
            { name: "Figma", level: "primary", context: "メイン使用" },
            { name: "Adobe Photoshop / Illustrator", level: "secondary" },
            { name: "DaVinci Resolve / Premiere Pro", level: "primary" },
            { name: "Lightroom / Capture One", level: "primary" },
          ],
        },
        {
          category: "Architecture & Methodology",
          items: [
            { name: "クリーンアーキテクチャ（5層設計）", level: "primary" },
            { name: "CQRS", level: "primary" },
            { name: "デザインシステム構築", level: "primary" },
            { name: "monorepo構築", level: "secondary" },
          ],
        },
      ],
      cta: {
        headline: "プロジェクトについて相談する",
        subtext: "技術選定やチーム構成についてもお気軽にご相談ください。売り込みはしません。",
        buttonLabel: "対話を始める",
      },
    },
  },
};

export default portfolioData;
