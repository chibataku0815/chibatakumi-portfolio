import { HeroShaderBackground } from "@/features/hero/components";
import { PageTransition } from "@/shared/transitions";
import { Nav } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";
import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: portfolioData.site.title,
  description: portfolioData.site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`dark ${fontVariables}`}>
      <body className="antialiased">
        {/* Shader-generated background using hero.jpg (blurred + noise) */}
        <HeroShaderBackground />

        <PageTransition>
          <Nav />
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
