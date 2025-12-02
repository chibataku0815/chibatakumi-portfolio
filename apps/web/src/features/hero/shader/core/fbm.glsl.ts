/**
 * GLSL FBM (Fractal Brownian Motion) function
 * noise関数に依存
 */

export interface FbmOptions {
  octaves?: number;
  initialAmplitude?: number;
  amplitudeDecay?: number;
  initialFrequency?: number;
}

const defaults: Required<FbmOptions> = {
  octaves: 4,
  initialAmplitude: 0.5,
  amplitudeDecay: 0.55,
  initialFrequency: 1.5,
};

/**
 * FBM関数を生成（パラメータ注入可能）
 */
export function createFbmGlsl(options: FbmOptions = {}): string {
  const opts = { ...defaults, ...options };

  return /* glsl */ `
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = ${opts.initialAmplitude.toFixed(2)};
  float frequency = ${opts.initialFrequency.toFixed(2)};
  for (int i = 0; i < ${opts.octaves}; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= ${opts.amplitudeDecay.toFixed(2)};
    frequency *= 2.0;
  }
  return value;
}
`;
}
