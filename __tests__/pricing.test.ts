import MODELS, { findModel } from "../lib/models";
import {
  FINISH_RATES,
  getQuantities,
  getQuote,
  getStartingPrice,
  HomeConfig,
  RATES,
} from "../lib/pricing";
import { DEFAULT_FINISHES } from "../lib/viewerstate";
import {
  METAL_OPTIONS,
  TRIM_OPTIONS,
  WOOD_OPTIONS,
} from "../components/colors";
import { FLOOR_OPTIONS, TILE_OPTIONS } from "../components/materials";

const config = (
  cols: number,
  stories: number,
  changes: Partial<HomeConfig> = {},
): HomeConfig => ({
  cols,
  stories,
  finishes: DEFAULT_FINISHES,
  decks: {},
  ...changes,
});

const total = (...args: Parameters<typeof config>) =>
  getQuote(config(...args)).total;

describe("getQuantities", () => {
  it("counts what each model is built from", () => {
    MODELS.forEach(({ cols, stories }) => {
      const q = getQuantities(cols, stories);
      expect(q.modules).toBe(cols * stories);
      expect(q.stackedModules).toBe(cols * (stories - 1));
      // 12 panes a story, across both long sides
      expect(q.glassPanes + q.cedarPanes).toBe(12 * stories);
      expect(q.endWallPanels).toBe(2 * cols * stories);
      expect(q.roofArea).toBe(320 * cols);
      expect(q.floorArea).toBe(320 * cols * stories);
      expect(q.stair).toBe(stories === 2);
    });
  });

  it("builds two-wide homes' closet and bath against cedar, not glass", () => {
    expect(getQuantities(2, 1).cedarPanes).toBe(2);
    expect(getQuantities(2, 2).cedarPanes).toBe(2);
    expect(getQuantities(3, 1).cedarPanes).toBe(0);
  });

  it("gives the kitchen that the home's width has room for", () => {
    expect(getQuantities(1, 1).kitchen).toBeNull();
    expect(getQuantities(1, 1).appliances).toEqual([]);
    expect(getQuantities(2, 1).kitchen).toBe("galley");
    expect(getQuantities(2, 1).appliances).toContain("bottomFreezerFridge");
    expect(getQuantities(4, 1).kitchen).toBe("services");
    expect(getQuantities(4, 1).appliances).toContain("frenchDoorFridge");
  });

  it("runs the stem wall around the foundation, set in from the modules", () => {
    // 31' x 39' less the corners the ends' walls butt into
    expect(getQuantities(4, 1).stemWall).toBeCloseTo(2 * 39 + 2 * (31 - 4 / 3));
    expect(getQuantities(4, 1).stemWall).toBeGreaterThan(
      getQuantities(2, 2).stemWall,
    );
  });

  it("counts a deck from when it's added until it starts lifting", () => {
    expect(getQuantities(3, 1, { 1: "dropping" }).decks).toBe(1);
    expect(getQuantities(3, 1, { [-1]: "landed", 1: "landed" }).decks).toBe(2);
    expect(getQuantities(3, 1, { 1: "lifting" }).decks).toBe(0);
  });
});

describe("getQuote", () => {
  it("prices each line as its quantity times its rate, and adds them up", () => {
    MODELS.forEach(({ cols, stories }) => {
      const { items, total } = getQuote(
        config(cols, stories, { decks: { 1: "landed" } }),
      );
      items.forEach(({ quantity, rate, amount }) =>
        expect(amount).toBe(Math.round(quantity * rate)),
      );
      expect(total).toBe(items.reduce((sum, { amount }) => sum + amount, 0));
      expect(new Set(items.map(({ id }) => id)).size).toBe(items.length);
    });
  });

  it("leaves out what a home doesn't have", () => {
    const ids = getQuote(config(1, 1)).items.map(({ id }) => id);
    expect(ids).not.toContain("stair");
    expect(ids).not.toContain("stacking");
    expect(ids).not.toContain("decks");
    expect(ids).not.toContain("tile");
    expect(ids).toContain("modules");
  });

  it("prices a 2x2 above a 4x1, for its glass, stair and stacking", () => {
    expect(total(2, 2)).toBeGreaterThan(total(4, 1));
  });

  it("prices two stories above one of the same width, and wider above narrower", () => {
    [2, 3, 4].forEach((cols) =>
      expect(total(cols, 2)).toBeGreaterThan(total(cols, 1)),
    );
    [1, 2, 3, 4].forEach((cols) =>
      expect(total(cols + 1, 1)).toBeGreaterThan(total(cols, 1)),
    );
  });

  it("adds a deck's price, and its wood's, when one is added", () => {
    const walnut = { ...DEFAULT_FINISHES, wood: WOOD_OPTIONS[2].value };
    expect(total(3, 1, { decks: { 1: "dropping" } }) - total(3, 1)).toBe(
      RATES.deck,
    );
    expect(
      total(3, 1, { decks: { 1: "landed" }, finishes: walnut }) -
        total(3, 1, { finishes: walnut }),
    ).toBe(RATES.deck + FINISH_RATES.woodDeck.Walnut);
  });

  it("charges for premium finishes and not for included ones", () => {
    const priced = (finishes: Partial<typeof DEFAULT_FINISHES>) =>
      total(2, 2, {
        finishes: { ...DEFAULT_FINISHES, ...finishes },
        decks: { 1: "landed" },
      }) - total(2, 2, { decks: { 1: "landed" } });

    const copper = METAL_OPTIONS.find(({ name }) => name === "Copper")!;
    expect(priced({ metal: copper.value })).toBe(4 * FINISH_RATES.metal.Copper);
    expect(priced({ floor: "concrete" })).toBe(
      1280 * FINISH_RATES.floor.Concrete,
    );
    const espresso = WOOD_OPTIONS.find(({ name }) => name === "Espresso")!;
    expect(priced({ wood: espresso.value })).toBe(
      2 * FINISH_RATES.woodSiding.Espresso + FINISH_RATES.woodDeck.Espresso,
    );
    expect(priced({ floor: "carpet" })).toBe(0);
    expect(priced({ trim: TRIM_OPTIONS[0].value })).toBe(0);
  });

  it("has a rate for every swatch in the dock", () => {
    const names = (options: readonly { name: string }[]) =>
      options.map(({ name }) => name).sort();
    expect(Object.keys(FINISH_RATES.metal).sort()).toEqual(
      names(METAL_OPTIONS),
    );
    expect(Object.keys(FINISH_RATES.trim).sort()).toEqual(names(TRIM_OPTIONS));
    expect(Object.keys(FINISH_RATES.woodSiding).sort()).toEqual(
      names(WOOD_OPTIONS),
    );
    expect(Object.keys(FINISH_RATES.woodDeck).sort()).toEqual(
      names(WOOD_OPTIONS),
    );
    expect(Object.keys(FINISH_RATES.floor).sort()).toEqual(
      names(FLOOR_OPTIONS),
    );
    expect(Object.keys(FINISH_RATES.tile).sort()).toEqual(names(TILE_OPTIONS));
  });
});

describe("getStartingPrice", () => {
  it("is the price with the default finishes, which are all included", () => {
    const model = findModel("mod3x2")!;
    expect(getStartingPrice(model)).toBe(total(3, 2));
    getQuote(config(3, 2))
      .items.filter(({ group }) => group === "Finishes")
      .forEach(({ amount }) => expect(amount).toBe(0));
  });
});
