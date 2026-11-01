import { FOUNDATION, getStemWalls, WallBox } from "../components/foundation";

const extent = (walls: WallBox[], axis: number) => [
  Math.min(...walls.map((w) => w.position[axis] - w.size[axis] / 2)),
  Math.max(...walls.map((w) => w.position[axis] + w.size[axis] / 2)),
];

const area = (walls: WallBox[]) =>
  walls.reduce((sum, { size }) => sum + size[0] * size[2], 0);

describe("stem walls", () => {
  it("rings the footprint in 8 inch walls, leaving the middle open", () => {
    const [width, depth] = [15, 39];
    const walls = getStemWalls(width, depth);
    expect(walls).toHaveLength(4);
    expect(extent(walls, 0)).toEqual([-width / 2, width / 2]);
    expect(extent(walls, 2)).toEqual([-depth / 2, depth / 2]);
    walls.forEach(({ size }) => {
      expect(Math.min(size[0], size[2])).toBeCloseTo(FOUNDATION.wall);
      expect(size[1]).toBe(FOUNDATION.height);
    });
    // the end walls stand between the side walls, so none overlap
    const inside =
      (width - 2 * FOUNDATION.wall) * (depth - 2 * FOUNDATION.wall);
    expect(area(walls)).toBeCloseTo(width * depth - inside);
  });

  it.each([-1, 1] as const)(
    "leaves out the wall along an open side, %i",
    (open) => {
      const [width, depth] = [8, 39];
      const walls = getStemWalls(width, depth, open);
      expect(walls).toHaveLength(3);
      expect(extent(walls, 0)).toEqual([-width / 2, width / 2]);
      // the end walls run on to the open edge
      walls
        .filter(({ size }) => size[2] === FOUNDATION.wall)
        .forEach(({ position, size }) =>
          expect(position[0] + (open * size[0]) / 2).toBeCloseTo(
            (open * width) / 2,
          ),
        );
      const [side] = walls.filter(({ size }) => size[2] === depth);
      expect(Math.sign(side.position[0])).toBe(-open);
    },
  );
});
