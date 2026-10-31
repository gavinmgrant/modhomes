import {
  getRimMesh,
  getRodTransform,
  getShellMesh,
  getShellPoint,
  getStoolBase,
  getStoolFootprint,
  SEAT_HEIGHT,
} from "../components/stool";
import { AISLE, COUNTER_DEPTH, getStools, ISLAND } from "../components/kitchen";
import { getServicesLayout, ROOMS } from "../components/services";

// Rotates (0, 1, 0) by a quaternion
const turnUp = ([x, y, z, w]: number[]) => [
  2 * (x * y - w * z),
  1 - 2 * (x * x + z * z),
  2 * (y * z + w * x),
];

const shell = () => {
  const points: number[][] = [];
  for (let j = 0; j <= 60; j++) {
    for (let i = 0; i <= 24; i++) {
      points.push(getShellPoint((2 * i) / 24 - 1, j / 60));
    }
  }
  return points;
};

describe("counter stool", () => {
  it("is sized like a counter stool, in inches", () => {
    const points = shell();
    const along = (k: number) => points.map((p) => p[k]);
    // about 19" wide, 21" deep and 40" to the top of the back
    expect(Math.max(...along(0)) - Math.min(...along(0))).toBeLessThan(19);
    expect(Math.max(...along(0)) - Math.min(...along(0))).toBeGreaterThan(18);
    expect(Math.max(...along(2)) - Math.min(...along(2))).toBeCloseTo(21, 0);
    expect(Math.max(...along(1))).toBeCloseTo(40, 0);
    // the seat's front edge at the seat height, its waterfall lip below it
    expect(getShellPoint(0, 1 / 6)[1]).toBeCloseTo(SEAT_HEIGHT, 0);
    expect(getShellPoint(0, 0)[1]).toBeLessThan(SEAT_HEIGHT - 1);
  });

  it("dishes the seat and wraps the back around the sitter", () => {
    // the seat's edges sit higher than its middle
    const [, middleY] = getShellPoint(0, 0.33);
    const [, edgeY] = getShellPoint(1, 0.33);
    expect(edgeY).toBeGreaterThan(middleY + 1);
    // and the back's edges reach further forward than its middle
    expect(getShellPoint(1, 0.85)[2]).toBeGreaterThan(
      getShellPoint(0, 0.85)[2] + 1,
    );
    // with its top corners rounded off
    expect(getShellPoint(1, 1)[1]).toBeLessThan(getShellPoint(0, 1)[1] - 2);
  });

  it("stands on four splayed legs joined by a square footring", () => {
    const { legs, footring, bracket, feet, mounts } = getStoolBase();
    expect(legs).toHaveLength(4);
    expect(footring).toHaveLength(4);
    expect(bracket).toHaveLength(4);
    legs.forEach(({ from, to }) => {
      // from a glide on the floor, splaying out from under the seat
      expect(from[1]).toBeGreaterThan(0);
      expect(from[1]).toBeLessThan(0.5);
      expect(Math.abs(from[0])).toBeGreaterThan(Math.abs(to[0]) + 4);
      expect(Math.abs(from[2])).toBeGreaterThan(Math.abs(to[2]) + 4);
      // up to a mount just under the seat
      expect(to[1]).toBeGreaterThan(SEAT_HEIGHT - 4);
      expect(to[1]).toBeLessThan(SEAT_HEIGHT);
    });
    footring.forEach(({ from, to }) => {
      expect(from[1]).toBeCloseTo(9);
      expect(to[1]).toBeCloseTo(9);
    });
    // the base fits under the shell's outline
    const footprint = getStoolFootprint({ x: 0, z: 0, facing: 1 });
    [...feet, ...mounts].forEach(([x, , z]) => {
      expect(x / 12).toBeGreaterThan(footprint.x[0]);
      expect(x / 12).toBeLessThan(footprint.x[1]);
      expect(z / 12).toBeGreaterThan(footprint.z[0]);
      expect(z / 12).toBeLessThan(footprint.z[1]);
    });
  });

  it("turns each rod's cylinder to lie along it", () => {
    const { legs, footring } = getStoolBase();
    [...legs, ...footring].forEach((rod) => {
      const { position, length, quaternion } = getRodTransform(rod);
      const along = rod.to.map((c, i) => (c - rod.from[i]) / 12);
      expect(length).toBeCloseTo(Math.hypot(...along));
      turnUp(quaternion).forEach((c, i) =>
        expect(c).toBeCloseTo(along[i] / length),
      );
      position.forEach((c, i) =>
        expect(c).toBeCloseTo((rod.from[i] + rod.to[i]) / 24),
      );
    });
  });

  it("builds whole meshes for the shell and its rim", () => {
    [getShellMesh(), getRimMesh()].forEach(
      ({ positions, normals, indices }) => {
        expect(positions).toHaveLength(normals.length);
        const count = positions.length / 3;
        indices.forEach((i) => {
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(count);
        });
        for (let k = 0; k < normals.length; k += 3) {
          expect(Math.hypot(...normals.slice(k, k + 3))).toBeCloseTo(1);
        }
      },
    );
  });

  it("faces the island, its seat tucked under the overhang", () => {
    const layout = getServicesLayout(3)!;
    expect(layout.stools).toEqual(getStools(ROOMS.kitchen));
    expect(layout.stools).toHaveLength(3);
    // the island's stool-side counter edge, and its cabinets behind it
    const edge = ROOMS.kitchen.z[1] - COUNTER_DEPTH - AISLE - ISLAND.depth;
    const base = edge + ISLAND.overhang;
    layout.stools.forEach((stool) => {
      expect(stool.facing).toBe(1);
      const footprint = getStoolFootprint(stool);
      // the seat's lip under the counter, short of the island's cabinets
      expect(footprint.z[1]).toBeGreaterThan(edge);
      expect(footprint.z[1]).toBeLessThan(base);
      const feet = getStoolBase().feet.map(([, , z]) => stool.z + z / 12);
      expect(Math.max(...feet)).toBeLessThan(base);
    });
    // side by side without touching
    const xs = layout.stools.map((stool) => getStoolFootprint(stool).x);
    xs.slice(1).forEach((x, i) => expect(x[0]).toBeGreaterThan(xs[i][1]));
  });
});
