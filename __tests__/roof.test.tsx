import { getHipRoofTriangles, getNormal } from "../components/roof";
import { getParapetTop } from "../components/homemodel";

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

  it("slopes every side equally", () => {
    const slopes = getHipRoofTriangles(15, 39, 0.8).map((triangle) => {
      const [nx, ny, nz] = getNormal(triangle);
      return Math.hypot(nx, nz) / ny;
    });
    slopes.forEach((slope) => expect(slope).toBeCloseTo(0.8 / 7.5));
  });
});
