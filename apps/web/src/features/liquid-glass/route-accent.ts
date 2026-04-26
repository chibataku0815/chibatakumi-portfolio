const ROUTE_ACCENTS: readonly [prefix: string, accent: string][] = [
  ["/experiments/grid", "#3a8acd"],
  ["/experiments/flow", "#b85cba"],
  ["/experiments/dot", "#f0b25a"],
  ["/experiments", "#f0b25a"],
  ["/journal", "#f5c36d"],
  ["/contact", "#e8a85a"],
  ["/photography", "#ecd7b5"],
  ["/filmtone", "#f0b25a"],
];

export function getLiquidGlassRouteAccent(pathname: string): string {
  const normalizedPathname = pathname.replace(/^\/(en|ja)(?=\/|$)/, "") || "/";

  for (const [prefix, accent] of ROUTE_ACCENTS) {
    if (
      normalizedPathname === prefix ||
      normalizedPathname.startsWith(`${prefix}/`)
    ) {
      return accent;
    }
  }

  return "#e8a85a";
}
