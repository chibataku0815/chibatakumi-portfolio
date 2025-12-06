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
  tagline: string;
  scrollText: string;
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
  ctaText: string;
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
      { href: "/motion", label: "Motion" },
      { href: "/interactive", label: "Interactive" },
      { href: "/installation", label: "Installation" },
      { href: "/archive", label: "Archive" },
      { href: "/contact", label: "Contact" },
    ],
  },

  // ---------------------------------------------------------------------------
  // Hero
  // ---------------------------------------------------------------------------
  hero: {
    title: "Takumi Chiba",
    tagline: "コードを書く。撮る。編む。",
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
          "Crafting immersive web applications with cutting-edge technologies and thoughtful interactions.",
        meta: "Web Development",
      },
      {
        id: "02",
        title: "Creative Engineering",
        description:
          "Building tools and systems that bridge design and technology, enabling new forms of expression.",
        meta: "Frontend Engineering",
      },
      {
        id: "03",
        title: "Design Systems",
        description:
          "Creating scalable component libraries and design tokens that ensure consistency across products.",
        meta: "Design Systems",
      },
      {
        id: "04",
        title: "Motion & Interaction",
        description:
          "Developing fluid animations and micro-interactions that bring interfaces to life.",
        meta: "Animation",
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
      title: "Let's Talk",
      description:
        "Interested in collaboration or have a project in mind? I'd love to hear from you.",
      email: "hello@takumichiba.com",
      ctaText: "Get in Touch",
    },
  },
};

export default portfolioData;
