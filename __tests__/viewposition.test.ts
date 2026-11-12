import {
  loadInsideView,
  parseView,
  saveInsideView,
  toViewParam,
} from "../lib/viewposition";
import {
  getConfigPath,
  parseConfig,
  serializeConfig,
} from "../lib/homeconfig";

describe("the view in the URL", () => {
  beforeEach(() => window.localStorage.clear());

  it("reads inside or outside, and nothing else", () => {
    expect(parseView({ view: "inside" })).toBe(true);
    expect(parseView({ view: "outside" })).toBe(false);
    expect(parseView({ view: ["inside", "outside"] })).toBe(true);
    expect(parseView({})).toBeUndefined();
    expect(parseView({ view: "Inside" })).toBeUndefined();
    expect(parseView({ view: "" })).toBeUndefined();
  });

  it("writes the param it reads", () => {
    expect(toViewParam(true)).toBe("view=inside");
    expect(toViewParam(false)).toBe("view=outside");
    expect(parseView({ view: toViewParam(true).split("=")[1] })).toBe(true);
  });

  it("opens the URL's view over the one used last", () => {
    saveInsideView(false);
    expect(loadInsideView({ view: "inside" })).toBe(true);
    saveInsideView(true);
    expect(loadInsideView({ view: "outside" })).toBe(false);
  });

  it("opens the one used last when the URL doesn't name a view", () => {
    expect(loadInsideView({})).toBe(false);
    expect(loadInsideView()).toBe(false);
    saveInsideView(true);
    expect(loadInsideView({})).toBe(true);
    expect(loadInsideView({ view: "upstairs" })).toBe(true);
    expect(loadInsideView({ floor: "concrete" })).toBe(true);
  });

  it("isn't part of the home, so the checkout and the URL's finishes leave it out", () => {
    const query = { floor: "concrete", view: "inside" };
    const config = parseConfig(query);
    expect(config).toEqual(parseConfig({ floor: "concrete" }));
    expect(serializeConfig(config)).toEqual({ floor: "concrete" });
    expect(getConfigPath("mod3x2", config, "checkout")).toBe(
      "/homes/mod3x2/checkout?floor=concrete",
    );
  });
});
