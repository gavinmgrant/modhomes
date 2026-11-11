import { COLORS } from "../components/colors";
import type { FloorMaterial } from "../components/materials";
import {
  DeckSide,
  Decks,
  landDecks,
  settleDeck,
  toggleDeck,
} from "../components/deck";
import type { ApplianceId } from "./appliances";

// Everything the model page lets the viewer choose, and how one choice
// changes the others: switching views lands any moving decks and closes an
// appliance's card, and so does hiding the spec dots, for the card

// The finishes in the dock: the metal siding, window and door trim, wood
// siding and decks outside, and the floor and wall tile inside
export type Finishes = {
  metal: string;
  trim: string;
  wood: string;
  floor: FloorMaterial;
  tile: string;
};

export const DEFAULT_FINISHES: Finishes = {
  metal: COLORS.white,
  trim: COLORS.trim,
  wood: COLORS.siding,
  floor: "walnut",
  tile: COLORS.tile,
};

export type ViewerState = {
  isInside: boolean;
  finishes: Finishes;
  decks: Decks;
  // Whether the inside view shows its appliances' spec dots, and the one
  // whose card is open
  showSpecs: boolean;
  openAppliance: ApplianceId | null;
};

export const INITIAL_VIEWER: ViewerState = {
  isInside: false,
  finishes: DEFAULT_FINISHES,
  decks: {},
  showSpecs: true,
  openAppliance: null,
};

export type ViewerAction =
  | { type: "view"; inside: boolean }
  // Sets the finishes and decks at once, e.g. from the page's URL
  | { type: "load"; finishes: Finishes; decks: Decks }
  | {
      [K in keyof Finishes]: { type: "finish"; key: K; value: Finishes[K] };
    }[keyof Finishes]
  | { type: "toggleDeck"; side: DeckSide }
  | { type: "settleDeck"; side: DeckSide }
  | { type: "specs"; on: boolean }
  | { type: "openAppliance"; appliance: ApplianceId | null };

export const viewerReducer = (
  state: ViewerState,
  action: ViewerAction,
): ViewerState => {
  switch (action.type) {
    case "view":
      // The new view draws the decks in place, without replaying their moves
      return {
        ...state,
        isInside: action.inside,
        decks: landDecks(state.decks),
        openAppliance: null,
      };
    case "load":
      return { ...state, finishes: action.finishes, decks: action.decks };
    case "finish":
      return {
        ...state,
        finishes: { ...state.finishes, [action.key]: action.value },
      };
    case "toggleDeck":
      return { ...state, decks: toggleDeck(state.decks, action.side) };
    case "settleDeck":
      return { ...state, decks: settleDeck(state.decks, action.side) };
    case "specs":
      return { ...state, showSpecs: action.on, openAppliance: null };
    case "openAppliance":
      return { ...state, openAppliance: action.appliance };
  }
};

export type SetFinish = <K extends keyof Finishes>(
  key: K,
  value: Finishes[K],
) => void;

// Picks one finish. TypeScript can't see that a generic key and its value
// make one of the action's pairs, hence the cast
export const pickFinish = <K extends keyof Finishes>(
  key: K,
  value: Finishes[K],
) => ({ type: "finish", key, value }) as ViewerAction;
