import MODELS, { findModel } from "../lib/models";
import { parseModel } from "../components/homemodel";

describe("models", () => {
  it("lists every model once, by its slug", () => {
    expect(MODELS.map((model) => model.slug)).toEqual([
      "mod1x1",
      "mod2x1",
      "mod3x1",
      "mod4x1",
      "mod5x1",
      "mod2x2",
      "mod3x2",
      "mod4x2",
    ]);
  });

  it("works out each model's area and footprint from its modules", () => {
    expect(findModel("mod3x2")).toMatchObject({
      name: "Mod 3x2",
      area: 1920,
      footprint: [24, 40],
    });
    expect(findModel("mod1x1")).toMatchObject({
      area: 320,
      footprint: [8, 40],
    });
  });

  it("agrees with the slug about its size", () => {
    MODELS.forEach(({ slug, cols, stories }) =>
      expect(parseModel(slug)).toEqual({ cols, stories }),
    );
  });

  it("finds nothing for a slug that isn't a model", () => {
    expect(findModel("mod9x9")).toBeUndefined();
    expect(findModel(undefined)).toBeUndefined();
  });
});
