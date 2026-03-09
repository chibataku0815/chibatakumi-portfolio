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
  strokeWidth: number;
  minSize: number;
  clearSpace: number;
  /** 単一パスに結合してgetTotalLength()対応 */
  paths: string[];
}

export interface WordmarkConfig {
  full: string;
  firstName: string;
  lastName: string;
  ariaLabel: string;
}

// === Work Items ===

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  meta: string;
  media?: Media;
  role?: string;
  tags?: string[];
  background?: string;
  accent?: string;
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
  wordmark: WordmarkConfig;
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
  skills: WorksSection;
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

// Works/Skills 共通で使うマルチスキル項目
// 順序: 1.開発 2.デザイン 3.写真 4.映像 5.コーヒー
const multiskillItems: WorkItem[] = [
  {
    id: "02",
    title: "Code & Interaction Systems",
    description:
      "Next.js / TypeScript / Three.js を軸に、インタラクションとパフォーマンスを両立。デザインシステムとモーションを同じ視点で実装し、データ接続も担う。",
    meta: "Code & Interaction",
    role: "Frontend / Creative Coding",
    tags: ["Next.js", "Three.js", "GSAP", "Design Systems"],
    media: { type: "image", src: "/spotlight/img_4.jpg", alt: "Interactive" },
    background: "#0c0c0c",
    accent: "#e8a85a",
  },
  {
    id: "04",
    title: "Identity & Systems",
    description:
      "写真・映像・UIが同じ声で鳴るようにデザインシステムを構築。ブランドトーンと実装ルールをセットで定義し、運用まで伴走する。",
    meta: "Identity & Systems",
    role: "Design System / Frontend Lead",
    tags: ["Brand Voice", "Component Library", "Figma", "Guideline"],
    media: { type: "image", src: "/spotlight/img_10.jpg", alt: "Identity Systems" },
    background: "#0d0d0d",
    accent: "#f0b25a",
  },
  {
    id: "01",
    title: "Visual & Photo Direction",
    description:
      "スタジオ/ロケ撮影からカラー設計、Web/誌面での再現までをワンストップ。光とトーンを先に決め、実装時の再現性まで見据えて仕上げる。",
    meta: "Visual & Photo",
    role: "Photography / Color Science",
    tags: ["Lighting Design", "Color Grading", "Retouch & Delivery", "Film & Stills"],
    media: { type: "image", src: "/spotlight/img_1.jpg", alt: "Visual Direction" },
    background: "#0b0b0b",
    accent: "#f2b869",
  },
  {
    id: "03",
    title: "Motion & Sound Layering",
    description:
      "タイポとサウンドを同期させたモーショングラフィック。スクロールや入力に応じたダイナミクスを設計し、Web再生向けに軽量化する。",
    meta: "Motion & Sound",
    role: "Motion / Sound Design",
    tags: ["Kinetic Type", "Sound Reactive", "After Effects", "Web Playback"],
    media: { type: "image", src: "/spotlight/img_7.jpg", alt: "Motion and Sound" },
    background: "#0b0b0b",
    accent: "#e19246",
  },
  {
    id: "05",
    title: "Coffee & Hospitality",
    description:
      "スペシャルティコーヒーの焙煎・抽出から、空間演出としてのサービス設計まで。一杯を通じて体験全体をデザインする視点を持つ。",
    meta: "Coffee & Hospitality",
    role: "Barista / Coffee Consultant",
    tags: ["Specialty Coffee", "Roasting", "Extraction", "Hospitality"],
    media: { type: "image", src: "/spotlight/img_5.jpg", alt: "Coffee" },
    background: "#0b0b0b",
    accent: "#c4a574",
  },
];

export const portfolioData: PortfolioData = {
  // ---------------------------------------------------------------------------
  // Site Configuration
  // ---------------------------------------------------------------------------
  site: {
    title: "Takumi Chiba - Portfolio",
    description:
      "Integrated creative partner blending code, visual direction, and editorial restraint. Code, Capture, Craft.",
    siteUrl: "https://www.chibatakumi.studio",
    locale: "ja",
    author: {
      name: "Takumi Chiba",
      email: "hello@takumichiba.com",
      role: "Software Engineer & Photographer",
    },
  },

  // ---------------------------------------------------------------------------
  // Branding
  // ---------------------------------------------------------------------------
  branding: {
    navBrand: "Takumi Chiba",
    wordmark: {
      full: "Takumi Chiba",
      firstName: "Takumi",
      lastName: "Chiba",
      ariaLabel: "Takumi Chiba home",
    },
    logo: {
      viewBox: "0 0 80 80",
      width: 80,
      height: 80,
      strokeWidth: 5,
      minSize: 16,
      clearSpace: 12,
      // Abstract "TC / 工" monoline mark tuned for favicon and stroke animation.
      paths: ["M62 16H20V64H62M40 16V64M20 40H50"],
    },
  },

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  navigation: {
    links: [
      { href: "/", label: "Index" },
      { href: "/skills", label: "Skills" },
      { href: "/photography", label: "Photography" },
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
    items: multiskillItems,
  },

  // ---------------------------------------------------------------------------
  // Skills (Multi-skill showcase)
  // ---------------------------------------------------------------------------
  skills: {
    items: multiskillItems,
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
      title: "お問い合わせ",
      description: "具体的な要件が決まる前の、漠然とした段階でも構いません。\nまずは、お気兼ねなくご相談ください。",
      email: "hello@takumichiba.com",
      cta: "内容を確認してメールを送る",
      responseNote: "通常、2営業日以内に返信いたします。",
    },

    // Profile Page
    profile: {
      header: {
        title: "Experience & Skills",
        subtitle:
          "デザイン、実装、映像制作。一人の作り手が全工程を担当することで、意図した通りのアウトプットを形にします。",
      },
      strengths: [
        {
          id: "design-engineering",
          title: "デザイン × エンジニアリング",
          description:
            "UI設計からプロトタイプ実装、本番コードまでを一貫して担当。デザインデータに基づき、忠実にコードへ実装します。",
          keywords: ["Figma", "React", "Next.js", "GSAP"],
        },
        {
          id: "enterprise-quality",
          title: "エンタープライズ品質",
          description:
            "クリーンアーキテクチャやCQRSパターンの導入により、複雑な業務ロジックに対応した、保守性と拡張性の高いコードベースを構築します。",
          keywords: ["クリーンアーキテクチャ", "CQRS", "AWS", "Playwright"],
        },
        {
          id: "full-cycle",
          title: "0→1開発の全フェーズ対応",
          description:
            "要件定義から技術選定、デザイン、実装、保守運用まで。プロジェクトの全フェーズを担当し、サービスの立ち上げから運用までを支援します。",
          keywords: ["要件定義", "技術選定", "UI/UX設計", "保守運用"],
        },
      ],
      experience: [
        {
          id: "exp-1",
          period: "2025.05 - 現在",
          type: "Enterprise DX",
          role: "フルスタック / リード",
          description:
            "Amazon Connectを用いた大規模コンタクトセンターシステムの刷新。5層クリーンアーキテクチャを導入し、複雑な業務ロジックを整理・実装。",
          achievements: [
            "5層アーキテクチャ設計および動的JOIN最適化の実装",
            "Amazon Connect / QuickSight連携機能の開発",
            "PlaywrightとBiomeによる品質ゲートの構築",
          ],
          techStack: [
            "Next.js 15",
            "TypeScript",
            "Drizzle ORM",
            "PostgreSQL",
            "AWS Connect",
          ],
          teamSize: "小規模チーム",
        },
        {
          id: "exp-2",
          period: "2024.12 - 2025.03",
          type: "SaaS / InsurTech",
          role: "フロントエンド / バックエンド",
          description:
            "大手損保グループの事故対応プラットフォーム開発。事案管理機能およびLINE連携チャット機能のバックエンド・フロントエンド開発を担当。",
          achievements: [
            "事故情報の登録・管理機能のバックエンド/フロントエンド実装",
            "LINE連携チャット機能のアーキテクチャ設計",
            "REST API設計および実装",
          ],
          techStack: [
            "Next.js 13",
            "Nest.js",
            "Prisma",
            "MySQL",
            "TypeScript",
          ],
          teamSize: "72名",
        },
        {
          id: "exp-3",
          period: "2022.05 - 2024.12",
          type: "SaaS Product",
          role: "フロントエンドリード",
          description:
            "SaaSプロダクト「おもてなしDX」のフロントエンドリード。フォーム作成エンジンの設計・実装および、生成AI連携機能の開発を担当。",
          achievements: [
            "フォームクリエーター（管理画面）のUI設計・実装",
            "Cognitoを用いた認証基盤の構築",
            "生成AIプラグイン for kintoneの開発",
          ],
          techStack: [
            "Remix",
            "React",
            "DynamoDB",
            "Cognito",
            "TypeScript",
          ],
          teamSize: "8-15名",
        },
        {
          id: "exp-4",
          period: "2015.04 - 2022.12",
          type: "新規事業開発",
          role: "デザイン / フロントエンド",
          description:
            "介護経営支援プラットフォームの新規立ち上げ。サービスロゴ制作・UIデザインからフロントエンド実装までを7年間にわたり担当。",
          achievements: [
            "7年9ヶ月の長期運用におけるUI/UX改善",
            "新規事業サイトの0→1デザイン・実装",
            "デザイナーチームへの設計共有と育成",
          ],
          techStack: [
            "Vue.js",
            "SCSS/BEM",
            "Figma",
            "Adobe XD",
            "Firebase",
          ],
          teamSize: "20名",
        },
        {
          id: "exp-5",
          period: "2018.05 - 2024.12",
          type: "受託開発（自社）",
          role: "代表 / フルスタック",
          description:
            "自社受託事業として6年以上稼働。技術選定からデザイン・実装までをワンストップで提供し、スタートアップのMVP開発を支援。",
          achievements: [
            "要件定義から運用保守まで全フェーズの完遂",
            "Firebase/Supabaseを活用した高速な開発サイクル",
            "クライアントへの技術コンサルティング",
          ],
          techStack: [
            "Remix",
            "Next.js",
            "Firebase",
            "Supabase",
            "Figma",
          ],
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
        headline: "プロジェクトのご相談",
        subtext:
          "技術的な実現可能性や、チーム体制についても。\nまずは気軽にお話ししましょう。",
        buttonLabel: "お問い合わせ",
      },
    },
  },
};

export default portfolioData;
