// Root layout — delegates to [locale]/layout.tsx for all rendering.
// This file exists only because Next.js requires a root layout.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
