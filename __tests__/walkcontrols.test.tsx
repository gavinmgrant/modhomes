import {
  getWalkBounds,
  getWalkStart,
  stepWithin,
} from "../components/walkcontrols";
import { parseModel } from "../components/homemodel";
import MODELS from "../lib/models";

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
      blocks: [],
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
    // walking diagonally into the front of the column pair at x = 0
    expect(stepWithin(bounds, -0.5, -1.5, 0.5, 1)).toEqual({ x: 0, z: -1.5 });
  });

  it("walks around the stair in two-story homes", () => {
    const bounds = getWalkBounds(2, 2);
    expect(bounds.blocks).toHaveLength(1);
    const [stair] = bounds.blocks;
    const midX = (stair.x[0] + stair.x[1]) / 2;
    // walking from the end wall toward the bottom step stops short of it
    const blocked = stepWithin(bounds, midX, 16, 0, -0.5);
    expect(blocked.z).toBe(16);
    // the same step is fine in a one-story home
    expect(stepWithin(getWalkBounds(2), midX, 16, 0, -0.5).z).toBe(15.5);
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
});
