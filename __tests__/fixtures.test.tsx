import {
  doors,
  DRAWER_HEIGHT,
  drawersOverDoors,
  FLOOR,
  FLOOR_TILE,
  fronts,
  getFootprints,
  LocalPart,
  shadeColor,
  tileColors,
  Part,
  tileFloor,
} from "../components/fixtures";

const middle = ({ u }: LocalPart) => (u[0] + u[1]) / 2;
const pulls = (parts: LocalPart[]) =>
  parts.filter((part) => part.finish === "stainless");
const panels = (parts: LocalPart[]) =>
  parts.filter((part) => part.finish === "walnut");

describe("cabinet fronts", () => {
  it("centres a drawer's pull", () => {
    const parts = fronts([0, 3], [0, 1], 0, 2, "top");
    panels(parts).forEach((panel, i) =>
      expect(middle(pulls(parts)[i])).toBeCloseTo(middle(panel)),
    );
  });

  it("pairs doors, their pulls either side of the gap between them", () => {
    const parts = doors([0, 4], [0, 2], 0, 2, "top");
    const [left, right] = pulls(parts).map(middle);
    expect(left).toBeGreaterThan(1.5);
    expect(left).toBeLessThan(2);
    expect(right).toBeGreaterThan(2);
    expect(right).toBeLessThan(2.5);
  });

  it("opens a lone door away from its hinge", () => {
    const [toHigh] = pulls(doors([0, 2], [0, 2], 0, 1, "top", 1)).map(middle);
    const [toLow] = pulls(doors([0, 2], [0, 2], 0, 1, "top", -1)).map(middle);
    expect(toHigh).toBeGreaterThan(1.5);
    expect(toLow).toBeLessThan(0.5);
    // the odd one out of three opens on its own
    const three = pulls(doors([0, 3], [0, 2], 0, 3, "top", -1)).map(middle);
    expect(three[0]).toBeGreaterThan(0.5);
    expect(three[1]).toBeLessThan(1.5);
    expect(three[2]).toBeLessThan(2.5);
  });

  it("puts a drawer over each base cabinet door", () => {
    const parts = drawersOverDoors([0, 4], [0, 2.5], 0, 2);
    const [drawers, doorPanels] = [
      panels(parts).filter((panel) => panel.y[0] > 1),
      panels(parts).filter((panel) => panel.y[0] < 1),
    ];
    expect(drawers).toHaveLength(2);
    expect(doorPanels).toHaveLength(2);
    drawers.forEach((drawer) => {
      expect(drawer.y[1] - drawer.y[0]).toBeCloseTo(DRAWER_HEIGHT);
      expect(drawer.y[1]).toBeCloseTo(2.5);
    });
    const tops = pulls(parts).filter((pull) => pull.y[0] > 2);
    const lower = pulls(parts).filter((pull) => pull.y[0] < 2);
    tops.forEach((pull, i) =>
      expect(middle(pull)).toBeCloseTo(middle(drawers[i])),
    );
    // the door pulls meet at the gap, not centred
    expect(lower.map(middle).every((u) => Math.abs(u - 2) < 0.5)).toBe(true);
  });
});

describe("floor tile", () => {
  const room = { x: [0, 7.25], z: [-3, 10.5] } as {
    x: [number, number];
    z: [number, number];
  };
  const parts = tileFloor(room);
  const lines = (axis: number) =>
    parts
      .filter((part) => part.finish === "grout" && part.size[axis] < 0.1)
      .map((part) => part.position[axis]);
  const centre = (part: Part, axis: number) => part.position[axis];

  it("draws the floor tile as a darker shade of the wall tile's colour", () => {
    expect(shadeColor("#cbbdaa", 1)).toBe("#cbbdaa");
    expect(shadeColor("#ffffff", 0)).toBe("#000000");
    const { tile, floorTile } = tileColors("#a9adad");
    expect(tile).toBe("#a9adad");
    // a neutral grey stays neutral, only darker
    const [r, g, b] = [1, 3, 5].map((i) =>
      parseInt(floorTile.slice(i, i + 2), 16),
    );
    expect(r).toBeLessThan(0xa9);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(1);
  });

  it("covers the room in floor tile", () => {
    const [tile] = parts;
    expect(tile.finish).toBe("floorTile");
    expect(centre(tile, 0)).toBeCloseTo(3.625);
    expect(tile.size[0]).toBeCloseTo(7.25);
    expect(tile.size[2]).toBeCloseTo(13.5);
  });

  it("lays a 12 inch grid, centred so opposite edges are cut alike", () => {
    [
      [lines(0), room.x],
      [lines(2), room.z],
    ].forEach(([at, [a0, a1]]) => {
      (at as number[]).slice(1).forEach((line, i) => {
        expect(line - (at as number[])[i]).toBeCloseTo(FLOOR_TILE.size);
      });
      const all = at as number[];
      expect(all[0] - a0).toBeCloseTo(a1 - all[all.length - 1]);
      expect(all[0] - a0).toBeGreaterThan(0);
      expect(all[0] - a0).toBeLessThanOrEqual(FLOOR_TILE.size);
    });
  });

  it("is never in the way when walking", () => {
    expect(getFootprints(parts)).toEqual([]);
    parts.forEach((part) => {
      expect(part.position[1] - part.size[1] / 2).toBeGreaterThanOrEqual(
        FLOOR - 1e-9,
      );
    });
  });
});
