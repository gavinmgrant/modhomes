import { getShadowExposure } from "../components/homestage";

describe("ground shadow exposure", () => {
  it("leaves the shadow as drei builds it, over its first 100 passes", () => {
    expect(getShadowExposure(0)).toBe(1);
    expect(getShadowExposure(100)).toBe(1);
  });

  it("makes up for the texture lightening with every pass after those", () => {
    const later = [102, 150, 300, 1000].map(getShadowExposure);
    later.reduce((previous, exposure) => {
      expect(exposure).toBeGreaterThan(previous);
      return exposure;
    }, 1);
    // never by more than how far short of fully lit the first build stops
    expect(getShadowExposure(5000)).toBeCloseTo(1 / (1 - Math.pow(0.99, 100)));
  });
});
