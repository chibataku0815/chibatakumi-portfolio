/**
 * Shader utilities barrel export
 */

// Core GLSL functions
export {
  glslHash,
  glslNoise,
  createFbmGlsl,
  getNoiseGlsl,
  type FbmOptions,
} from "./core";

// Configurations
export { heroShaderConfig, type HeroShaderConfig } from "./config";

// Materials
export { heroVertexShader, createHeroFragmentShader } from "./materials";

// Types
export type { HeroShaderUniforms, HeroShaderOptions } from "./types";
