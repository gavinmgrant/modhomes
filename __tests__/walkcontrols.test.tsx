import { getWalkBounds, stepWithin } from "../components/walkcontrols";

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
});
