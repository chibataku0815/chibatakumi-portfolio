import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

/**
 * メタデータの設定
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Portfolio",
  description: "Portfolio website",
};

/**
 * ルートレイアウトコンポーネント
 * @param {Object} props - プロパティオブジェクト
 * @param {React.ReactNode} props.children - 子要素
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="font-display bg-black text-copy">
        <nav className="fixed top-0 left-0 w-screen p-7 flex justify-between items-center">
          <div className="logo">LOGO</div>
          <div className="links flex gap-8">
            <Link href="#home" className="no-underline uppercase text-copy font-mono text-xs font-semibold p-2">Home</Link>
            <Link href="#projects" className="no-underline uppercase text-copy font-mono text-xs font-semibold p-2">Projects</Link>
            <Link href="#info" className="no-underline uppercase text-copy font-mono text-xs font-semibold p-2">Info</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
