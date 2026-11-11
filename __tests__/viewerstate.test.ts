import {
  DEFAULT_FINISHES,
  INITIAL_VIEWER,
  pickFinish,
  ViewerState,
  viewerReducer,
} from "../lib/viewerstate";
import { COLORS } from "../components/colors";

const viewer = (state: Partial<ViewerState> = {}): ViewerState => ({
  ...INITIAL_VIEWER,
  ...state,
});

describe("viewerReducer", () => {
  it("starts outside, in the default finishes, with no decks", () => {
    expect(INITIAL_VIEWER).toMatchObject({
      isInside: false,
      finishes: DEFAULT_FINISHES,
      decks: {},
      showSpecs: true,
      openAppliance: null,
    });
  });

  it("picks one finish and leaves the rest", () => {
    const next = viewerReducer(viewer(), pickFinish("metal", COLORS.taupe));
    expect(next.finishes).toEqual({ ...DEFAULT_FINISHES, metal: COLORS.taupe });
    expect(
      viewerReducer(next, pickFinish("floor", "concrete")).finishes,
    ).toEqual({ ...DEFAULT_FINISHES, metal: COLORS.taupe, floor: "concrete" });
  });

  it("lands moving decks and closes an appliance's card on switching views", () => {
    const next = viewerReducer(
      viewer({
        decks: { [-1]: "dropping", 1: "lifting" },
        openAppliance: "range",
      }),
      { type: "view", inside: true },
    );
    expect(next.isInside).toBe(true);
    expect(next.decks).toEqual({ [-1]: "landed" });
    expect(next.openAppliance).toBeNull();
  });

  it("keeps the finishes across views", () => {
    const picked = viewerReducer(viewer(), pickFinish("tile", "#575b5e"));
    const inside = viewerReducer(picked, { type: "view", inside: true });
    expect(inside.finishes.tile).toBe("#575b5e");
  });

  it("drops a deck, lands it, then lifts it away", () => {
    let state = viewerReducer(viewer(), { type: "toggleDeck", side: 1 });
    expect(state.decks).toEqual({ 1: "dropping" });
    state = viewerReducer(state, { type: "settleDeck", side: 1 });
    expect(state.decks).toEqual({ 1: "landed" });
    state = viewerReducer(state, { type: "toggleDeck", side: 1 });
    expect(state.decks).toEqual({ 1: "lifting" });
    state = viewerReducer(state, { type: "settleDeck", side: 1 });
    expect(state.decks).toEqual({});
  });

  it("loads the finishes and decks together, keeping the view", () => {
    const finishes = { ...DEFAULT_FINISHES, floor: "concrete" as const };
    const next = viewerReducer(
      viewer({ isInside: true, decks: { 1: "landed" } }),
      { type: "load", finishes, decks: { [-1]: "landed" } },
    );
    expect(next.finishes).toEqual(finishes);
    expect(next.decks).toEqual({ [-1]: "landed" });
    expect(next.isInside).toBe(true);
  });

  it("opens and closes an appliance's card", () => {
    const open = viewerReducer(viewer(), {
      type: "openAppliance",
      appliance: "frenchDoorFridge",
    });
    expect(open.openAppliance).toBe("frenchDoorFridge");
    expect(
      viewerReducer(open, { type: "openAppliance", appliance: null })
        .openAppliance,
    ).toBeNull();
  });

  it("closes the open card when the spec dots are hidden", () => {
    const next = viewerReducer(viewer({ openAppliance: "dishwasher" }), {
      type: "specs",
      on: false,
    });
    expect(next.showSpecs).toBe(false);
    expect(next.openAppliance).toBeNull();
  });
});
