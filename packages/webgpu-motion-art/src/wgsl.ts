import { paletteRgb } from "./uniforms";
import type { PaletteToken } from "./tokens";

function asVec3f(token: PaletteToken): string {
  const [r, g, b] = paletteRgb(token);
  return `vec3f(${r.toFixed(6)}, ${g.toFixed(6)}, ${b.toFixed(6)})`;
}

// WGSL palette fragment. Prepend to any shader module that needs canonical colors:
//   const code = `${PALETTE_WGSL}\n${shaderSrc}`;
export const PALETTE_WGSL = [
  "// webgpu-motion-art palette (auto-generated)",
  `const PALETTE_INK:   vec3f = ${asVec3f("ink")};`,
  `const PALETTE_PAPER: vec3f = ${asVec3f("paper")};`,
  `const PALETTE_WHITE: vec3f = ${asVec3f("white")};`,
  `const PALETTE_SPARK: vec3f = ${asVec3f("spark")};`,
  `const PALETTE_GLOW:  vec3f = ${asVec3f("glow")};`,
].join("\n");
