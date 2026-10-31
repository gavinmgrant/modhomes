import {
  getWalkBounds,
  getWalkStart,
  isBlocked,
  stepWithin,
  WalkBounds,
} from "../components/walkcontrols";
import { parseModel } from "../components/homemodel";
import { getStairLayout } from "../components/stair";
import { getServicesBlocks, getServicesModuleX } from "../components/services";
import MODELS from "../lib/models";

// Every spot reachable from `start` in small steps, on a 1/4 ft grid
const GRID = 0.25;
const reachable = (bounds: WalkBounds, start: { x: number; z: number }) => {
  const key = (i: number, j: number) => `${i},${j}`;
  const seen = new Set<string>();
  const queue: [number, number][] = [
    [Math.round(start.x / GRID), Math.round(start.z / GRID)],
  ];
  seen.add(key(...queue[0]));
  while (queue.length) {
    const [i, j] = queue.pop()!;
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const [x, z] = [(i + di) * GRID, (j + dj) * GRID];
      if (
        Math.abs(x) > bounds.maxX ||
        Math.abs(z) > bounds.maxZ ||
        seen.has(key(i + di, j + dj)) ||
        isBlocked(bounds, x, z)
      ) {
        continue;
      }
      seen.add(key(i + di, j + dj));
      queue.push([i + di, j + dj]);
    }
  }
  return (x: number, z: number) =>
    seen.has(key(Math.round(x / GRID), Math.round(z / GRID)));
};

describe("walkcontrols", () => {
  it("keeps the walkable area inside the modules", () => {
    expect(getWalkBounds(1)).toEqual({
      maxX: 3,
      maxZ: 18.5,
      columns: [],
      blocks: [],
    });
    expect(getWalkBounds(3)).toEqual({
      maxX: 11,
      maxZ: 18.5,
      columns: [-4, 4],
      blocks: getServicesBlocks(3),
    });
  });

  it("stops at the outer walls", () => {
    const bounds = getWalkBounds(2);
    expect(stepWithin(bounds, 6.5, 18, 5, 5)).toEqual({ x: 7, z: 18.5 });
    expect(stepWithin(bounds, -6.5, -18, -5, -5)).toEqual({ x: -7, z: -18.5 });
  });

  it("blocks walking through the columns where modules meet", () => {
    const bounds = getWalkBounds(2);
    // walking along z = 0 towards the column pair at x = 0
    expect(stepWithin(bounds, -1.5, 0, 0.5, 0)).toEqual({ x: -1.5, z: 0 });
    // the same step away from the columns is fine
    expect(stepWithin(bounds, -1.5, 3, 0.5, 0)).toEqual({ x: -1, z: 3 });
  });

  it("slides along a column instead of stopping dead", () => {
    const bounds = getWalkBounds(2);
    // walking diagonally into the front of the column pair at x = 0, in
    // the half clear of the galley
    expect(stepWithin(bounds, -0.5, 1.5, 0.5, -1)).toEqual({ x: 0, z: 1.5 });
  });

  it("walks around the stair in two-story homes", () => {
    const bounds = getWalkBounds(2, 2);
    const stair = getStairLayout(2).opening;
    expect(bounds.blocks).toContainEqual(stair);
    const midX = (stair.x[0] + stair.x[1]) / 2;
    // walking from the end wall toward the bottom step stops short of it
    const near = stair.z[1] + 1;
    const blocked = stepWithin(bounds, midX, near, 0, -0.5);
    expect(blocked.z).toBe(near);
    // the same step is fine in a one-story home
    expect(stepWithin(getWalkBounds(2), midX, near, 0, -0.5).z).toBe(
      near - 0.5
    );
  });

  it("starts every model in a corner, facing the opposite corner", () => {
    MODELS.forEach(({ slug }) => {
      const layout = parseModel(slug);
      const bounds = getWalkBounds(layout!.cols, layout!.stories);
      const { x, z, facing } = getWalkStart(bounds);
      // a step in from the front right corner
      expect(x).toBe(bounds.maxX - 1);
      expect(z).toBe(bounds.maxZ - 1);
      // looking across to the same spot in the back left corner
      expect([x + facing[0], z + facing[1]]).toEqual([-x, -z]);
      // clear of the stair, and of the columns where modules meet
      bounds.blocks.forEach((block) => {
        expect(x > block.x[1] || z > block.z[1]).toBe(true);
      });
      // (the columns all stand at z = 0)
      expect(Math.abs(z)).toBeGreaterThan(1);
      // and free to walk from
      expect(stepWithin(bounds, x, z, -0.5, -0.5)).toEqual({
        x: x - 0.5,
        z: z - 0.5,
      });
    });
  });

  it.each(["mod3x1", "mod4x1", "mod5x1", "mod3x2", "mod4x2"])(
    "walks into both bathrooms and around the kitchen in %s",
    (slug) => {
      const { cols, stories } = parseModel(slug)!;
      const bounds = getWalkBounds(cols, stories);
      const canReach = reachable(bounds, getWalkStart(bounds));
      const x = getServicesModuleX(cols);
      // inside the tub bath and the shower bath, between their fixtures
      expect(canReach(x, -16)).toBe(true);
      expect(canReach(x - 1, -6)).toBe(true);
      // in front of the fridge and pantry, and in the aisle by the range
      expect(canReach(x, 1.5)).toBe(true);
      expect(canReach(x, 15.5)).toBe(true);
      // but never into the tub, the island or through a bathroom wall
      expect(canReach(x - 1, -13)).toBe(false);
      expect(canReach(x, 12)).toBe(false);
      expect(canReach(x + 3.75, -8)).toBe(false);
    }
  );

  it.each(["mod2x1", "mod2x2"])(
    "walks into the bath, the closet and along the galley in %s",
    (slug) => {
      const { cols, stories } = parseModel(slug)!;
      const bounds = getWalkBounds(cols, stories);
      const canReach = reachable(bounds, getWalkStart(bounds));
      // in the bath by the glass, in the closet, and in front of the range
      expect(canReach(6, -2)).toBe(true);
      expect(canReach(5, -11)).toBe(true);
      expect(canReach(-1.5, -9)).toBe(true);
      // but never into the shower or through the counter
      expect(canReach(5, -7.5)).toBe(false);
      expect(canReach(1.5, -6)).toBe(false);
    }
  );
});
