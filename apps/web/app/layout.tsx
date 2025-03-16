import type { Metadata } from "next";
import { Space_Grotesk, Familjen_Grotesk } from "next/font/google";
import "./globals.css";
import { ViewTransitions } from "next-view-transitions";
import Nav from "./components/Nav";

/**
 * 見出し用フォント
 * Space Groteskは幾何学的でモダンな太字フォント
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

/**
 * 本文用フォント
 * Familjen Groteskは読みやすさとブルータリズムの特徴を兼ね備えたフォント
 */
const familjenGrotesk = Familjen_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-familjen-grotesk',
});

/**
 * メタデータの設定
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Portfolio",
  description: "Portfolio with smooth page transitions",
};

/**
 * ルートレイアウトコンポーネント
 * アプリケーション全体のレイアウトを定義します
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${spaceGrotesk.variable} ${familjenGrotesk.variable}`}>
      <body className={familjenGrotesk.className}>
        <ViewTransitions>
          <Nav />
          {children}
        </ViewTransitions>
      </body>
    </html>
  );
}
