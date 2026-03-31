/**
 * Bridge: re-exports quick-meta-sliders from the shared UI package.
 * Web consumers continue importing from this path; canonical source is film-lab-ui.
 */
export {
  quickMetaPatchForValue,
  quickMetaDisplayValue,
  type QuickMetaAxis,
} from "film-lab-ui";
