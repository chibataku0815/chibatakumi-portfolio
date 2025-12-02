/**
 * GLSL Hash function
 * 2D座標から擬似乱数を生成
 */
export const glslHash = /* glsl */ `
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
`;
