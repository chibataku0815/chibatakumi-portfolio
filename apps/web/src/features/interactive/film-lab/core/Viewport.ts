/**
 * Bridge: re-exports Viewport from the shared renderer package.
 * Web consumers continue importing from this path; canonical source is film-lab-renderer.
 */
export { Viewport, type ViewportOptions } from "film-lab-renderer";
