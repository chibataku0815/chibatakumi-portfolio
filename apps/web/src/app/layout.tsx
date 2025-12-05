import { HeroShaderBackground } from "@/features/hero/components";
import { PageTransition } from "@/shared/transitions";
import { Nav } from "@/shared/components";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Takumi Chiba - Portfolio",
  description: "Creative developer portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
