/**
 * Bridge: re-exports film-lab-reducer from the shared UI package.
 * Web consumers continue importing from this path; canonical source is film-lab-ui.
 */
export {
  filmLabReducer,
  createInitialState,
  createInitialStateFromSharedParams,
  toPresentSnapshot,
  type Action,
  type State,
  type PresentState,
  type GradeSlotState,
  type SlotId,
} from "film-lab-ui";
