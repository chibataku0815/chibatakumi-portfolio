// Re-export shim. The compose-pass interface and default blit live in
// `@chibatakumi/motion-core/compose` so motion-grid and motion-flow can
// implement the same plug-in shape without a sibling-on-sibling dep on
// motion-dot.
export {
  createDefaultBlitPass,
  type ComposePass,
  type ComposePassFrameContext,
} from "@chibatakumi/motion-core/compose";
