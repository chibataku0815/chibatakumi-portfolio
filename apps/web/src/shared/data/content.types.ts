export interface LocalizedText {
  ja?: string;
  en?: string;
}

export interface Genre {
  id: string;
  title: string;
  desc_ja?: string;
  desc_en?: string;
}

export interface ShowcaseItem {
  title: string;
  body_ja?: string;
  body_en?: string;
  tags: string[];
}

export interface ArchiveYear {
  year: number;
  entries: string[];
}

export interface ArchiveHighlight {
  title: string;
  body_ja?: string;
  body_en?: string;
}

export interface ContactInfo {
  intro_ja?: string;
  intro_en?: string;
  cta_label?: string;
  cta_link?: string;
}

export interface SeoInfo {
  title: string;
  description: string;
}

export interface LogoNotes {
  concept?: string;
  stroke_color?: string;
  fill_color?: string;
  path_hint?: string;
}

export interface SiteContent {
  hero: {
    title: LocalizedText;
    subtitle: LocalizedText;
    tagline?: LocalizedText;
  };
  genres: Genre[];
  motion: ShowcaseItem[];
  interactive: ShowcaseItem[];
  installation: ShowcaseItem[];
  archive: {
    years: ArchiveYear[];
    highlight: ArchiveHighlight;
  };
  contact: ContactInfo;
  seo: SeoInfo;
  logo_notes?: LogoNotes;
}
