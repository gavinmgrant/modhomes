import {
  getConfigPath,
  getFinishNames,
  parseConfig,
  serializeConfig,
  toParam,
  toQueryString,
} from "../lib/homeconfig";
import { DEFAULT_FINISHES } from "../lib/viewerstate";
import {
  METAL_OPTIONS,
  TRIM_OPTIONS,
  WOOD_OPTIONS,
} from "../components/colors";
import { FLOOR_OPTIONS, TILE_OPTIONS } from "../components/materials";

const copper = METAL_OPTIONS.find(({ name }) => name === "Copper")!.value;
const bronze = TRIM_OPTIONS.find(
  ({ name }) => name === "Statuary Bronze",
)!.value;

describe("home configuration in the URL", () => {
  it("writes nothing for the defaults, so a plain model's URL stays clean", () => {
    expect(serializeConfig({ finishes: DEFAULT_FINISHES, decks: {} })).toEqual(
      {},
    );
    expect(getConfigPath("mod3x2", parseConfig({}))).toBe("/homes/mod3x2");
  });

  it("names each finish by its swatch, in lowercase with dashes", () => {
    expect(toParam("Statuary Bronze")).toBe("statuary-bronze");
    const query = serializeConfig({
      finishes: { ...DEFAULT_FINISHES, metal: copper, floor: "concrete" },
      decks: { [-1]: "landed", 1: "dropping" },
    });
    expect(toQueryString(query)).toBe(
      "metal=copper&floor=concrete&decks=left,right",
    );
  });

  it("reads back every swatch it writes", () => {
    const options = {
      metal: METAL_OPTIONS,
      trim: TRIM_OPTIONS,
      wood: WOOD_OPTIONS,
      floor: FLOOR_OPTIONS,
      tile: TILE_OPTIONS,
    };
    Object.entries(options).forEach(([key, list]) =>
      list.forEach(({ value }) => {
        const finishes = { ...DEFAULT_FINISHES, [key]: value };
        expect(parseConfig(serializeConfig({ finishes, decks: {} }))).toEqual({
          finishes,
          decks: {},
        });
      }),
    );
  });

  it("opens decks already in place, and leaves out one being taken away", () => {
    expect(parseConfig({ decks: "left,right" }).decks).toEqual({
      [-1]: "landed",
      1: "landed",
    });
    expect(
      serializeConfig({
        finishes: DEFAULT_FINISHES,
        decks: { [-1]: "lifting", 1: "landed" },
      }),
    ).toEqual({ decks: "right" });
  });

  it("falls back to the default for anything it doesn't know", () => {
    expect(
      parseConfig({
        metal: "gold",
        floor: ["concrete", "carpet"],
        decks: "front,left",
        home: "mod3x2",
      }),
    ).toEqual({
      finishes: { ...DEFAULT_FINISHES, floor: "concrete" },
      decks: { [-1]: "landed" },
    });
  });

  it("links the home and its checkout", () => {
    const config = parseConfig({ metal: "copper", decks: "left" });
    expect(getConfigPath("mod2x2", config)).toBe(
      "/homes/mod2x2?metal=copper&decks=left",
    );
    expect(getConfigPath("mod2x2", config, "checkout")).toBe(
      "/homes/mod2x2/checkout?metal=copper&decks=left",
    );
  });

  it("names the swatch picked for each finish", () => {
    const names = getFinishNames({ ...DEFAULT_FINISHES, trim: bronze });
    expect(names.map(({ name }) => name)).toEqual([
      "White",
      "Statuary Bronze",
      "Cedar",
      "Walnut",
      "Urban Putty",
    ]);
  });
});
