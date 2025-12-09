import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_JP } from "next/font/google";

/**
 * Geist Sans - Primary Latin font
 * Modern, crisp sans-serif for English text
 */
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Geist Mono - Code display
 */
export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Noto Sans JP - Japanese text
 *
 * Design rationale:
 * - Neutral neo-grotesque complements Geist's "quiet intellect"
 * - Matches "Pitch Black & Fire" concept - understated, controlled
 * - Wide character coverage for professional content
 *
 * Weight selection:
 * - 300: Light body text, descriptions
 * - 400: Standard body
 * - 500: Emphasized text, keywords
 * - 700: Section headings (Japanese)
 */
export const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  preload: false,
  display: "swap",
});

/**
 * Combined font class names for <html> element
 */
export const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  notoSansJP.variable,
].join(" ");
