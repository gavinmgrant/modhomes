import { getStairLayout, getTreads } from "../components/stair";
import { getSlabPieces } from "../components/module";

describe("stair", () => {
  it("climbs 10 ft in 16 even risers of 7.5 inches", () => {
    const treads = getTreads();
    expect(treads).toHaveLength(15);
    const rises = treads.map((t, i) => t.y - (i ? treads[i - 1].y : -3.95));
    rises.forEach((rise) => expect(rise * 12).toBeCloseTo(7.5));
    // the last riser reaches the upper floor
    expect(6.05 - treads[treads.length - 1].y).toBeCloseTo(10 / 16);
  });

  it.each([2, 3, 4])(
    "fits inside the first module and is 4-5 ft wide (%i modules wide)",
    (cols) => {
      const { moduleX, footprint } = getStairLayout(cols);
      const width = footprint.x[1] - footprint.x[0];
      expect(width).toBeGreaterThanOrEqual(4);
      expect(width).toBeLessThanOrEqual(5);
      // inside the module's floor, short of the columns at its edge
      expect(footprint.x[0]).toBeGreaterThan(moduleX - 3.875);
      expect(footprint.x[1]).toBeLessThanOrEqual(moduleX + 3.375);
      // clear of the middle column, with 4-5 ft between the bottom step and
      // the end wall's inner face
      expect(footprint.z[0]).toBeGreaterThan(0.25);
      const clearance = 19.5 - footprint.z[1];
      expect(clearance).toBeGreaterThanOrEqual(4);
      expect(clearance).toBeLessThanOrEqual(5);
    }
  );

  it("lands every tread inside its footprint", () => {
    const { footprint } = getStairLayout(2);
    getTreads().forEach(({ z }) => {
      expect(z).toBeGreaterThan(footprint.z[0]);
      expect(z).toBeLessThan(footprint.z[1]);
    });
  });
});

describe("slab openings", () => {
  const area = (pieces: ReturnType<typeof getSlabPieces>) =>
    pieces.reduce((sum, p) => sum + p.width * p.depth, 0);

  it("keeps a slab whole with no opening", () => {
    expect(getSlabPieces(8, 40)).toEqual([{ x: 0, z: 0, width: 8, depth: 40 }]);
  });

  it("leaves exactly the hole uncovered", () => {
    const hole = {
      x: [-1.125, 3.375] as [number, number],
      z: [5, 17.5] as [number, number],
    };
    const pieces = getSlabPieces(8, 40, hole);
    expect(area(pieces)).toBeCloseTo(8 * 40 - 4.5 * 12.5);
    // no piece covers the middle of the hole
    pieces.forEach((p) => {
      const coversX = Math.abs(1.125 - p.x) < p.width / 2;
      const coversZ = Math.abs(11.25 - p.z) < p.depth / 2;
      expect(coversX && coversZ).toBe(false);
    });
  });
});
