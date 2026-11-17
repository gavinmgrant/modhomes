import {
  DECK,
  getDeckProfile,
  getHipRoofTriangles,
  getNormal,
  getRoofUndersideTriangles,
  offsetProfile,
} from "../components/roof";
import { getParapetTop } from "../lib/dimensions";

// Twice the signed area of a triangle seen from above, positive when it runs
// counter-clockwise looking down (+x right, -z up the page)
const planArea = ([a, b, c]: number[][]) =>
  (b[0] - a[0]) * -(c[2] - a[2]) - -(b[2] - a[2]) * (c[0] - a[0]);

describe("roof", () => {
  it("peaks level with the parapets and covers the roof slab", () => {
    // From one module wide to five, where the 39 ft square peaks in a point
    [7, 15, 23, 31, 39].forEach((width) => {
      const rise = getParapetTop(1) - 5.675;
      const triangles = getHipRoofTriangles(width, 39, rise);
      const heights = triangles.flat().map(([, y]) => y);
      expect(Math.max(...heights)).toBeCloseTo(0.825);
      expect(Math.min(...heights)).toBe(0);

      triangles.flat().forEach(([x, , z]) => {
        expect(Math.abs(x)).toBeLessThanOrEqual(width / 2);
        expect(Math.abs(z)).toBeLessThanOrEqual(39 / 2);
      });
      const area = triangles.reduce((sum, t) => sum + planArea(t) / 2, 0);
      expect(area).toBeCloseTo(width * 39);
    });
  });

  it("faces every slope up and out", () => {
    getHipRoofTriangles(15, 39, 0.8).forEach((triangle) => {
      const [nx, ny, nz] = getNormal(triangle);
      const centre = [0, 2].map(
        (axis) => triangle.reduce((sum, p) => sum + p[axis], 0) / 3,
      );
      expect(ny).toBeGreaterThan(0);
      // Outward: the normal leans away from the middle of the roof
      expect(nx * centre[0] + nz * centre[1]).toBeGreaterThan(0);
    });
  });

  it("closes the insulation's underside, facing down, under the whole hip", () => {
    const underside = getRoofUndersideTriangles(15, 39);
    underside.forEach((triangle) => {
      expect(getNormal(triangle)[1]).toBeCloseTo(-1);
      triangle.forEach(([, y]) => expect(y).toBe(0));
    });
    const area = underside.reduce((sum, t) => sum - planArea(t) / 2, 0);
    expect(area).toBeCloseTo(15 * 39);
  });

  it("slopes every side equally", () => {
    const slopes = getHipRoofTriangles(15, 39, 0.8).map((triangle) => {
      const [nx, ny, nz] = getNormal(triangle);
      return Math.hypot(nx, nz) / ny;
    });
    slopes.forEach((slope) => expect(slope).toBeCloseTo(0.8 / 7.5));
  });
});

describe("type B roof deck", () => {
  const profile = getDeckProfile(39);
  const inches = (feet: number) => feet * 12;

  it("runs 6 inch ribs, 1 1/2 inches deep, the length of the roof slab", () => {
    expect(profile[0][0]).toBeCloseTo(-19.5);
    expect(profile[profile.length - 1][0]).toBeCloseTo(19.5);
    const bottoms = profile.filter(([, y]) => y === 0);
    // Two points per bottom flange, one rib every 6" along 39 ft
    expect(bottoms).toHaveLength(2 * 78);
    expect(inches(bottoms[2][0] - bottoms[0][0])).toBeCloseTo(6);
    expect(inches(Math.max(...profile.map(([, y]) => y)))).toBeCloseTo(1.5);
  });

  it("has 3 1/2 inch top flanges and 1 3/4 inch bottom flanges", () => {
    // The level runs between the half flanges at either end
    const flanges = profile
      .slice(1, -2)
      .map((point, i) => [point, profile[i + 2]])
      .filter(([a, b]) => a[1] === b[1]);
    expect(flanges.length).toBeGreaterThan(0);
    flanges.forEach(([a, b]) =>
      expect(inches(b[0] - a[0])).toBeCloseTo(a[1] === 0 ? 1.75 : 3.5),
    );
  });

  it("keeps the sheet the same thickness on its webs and flanges", () => {
    const bottom = offsetProfile(profile, DECK.gauge);
    // A web runs from a top flange's end down to a bottom flange's start
    const [a, b] = [profile[1], profile[2]];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const length = Math.hypot(dx, dy);
    const distance = (p: number[]) =>
      Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / length;
    expect(distance(bottom[1])).toBeCloseTo(DECK.gauge);
    expect(distance(bottom[2])).toBeCloseTo(DECK.gauge);
    expect(profile[0][1] - bottom[0][1]).toBeCloseTo(DECK.gauge);
  });
});
