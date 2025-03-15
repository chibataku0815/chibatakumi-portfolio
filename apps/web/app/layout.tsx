import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ViewTransitions } from "next-view-transitions";
import Nav from "./components/Nav";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        <ViewTransitions>
          <Nav />
          {children}
        </ViewTransitions>
      </body>
    </html>
  );
}
