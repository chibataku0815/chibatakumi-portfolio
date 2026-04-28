/// <reference types="@webgpu/types" />

declare module "*.wgsl?raw" {
  const src: string;
  export default src;
}
