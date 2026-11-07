import {
  DAILY_ROOT_REQUEST_CAP,
  formatCoordinates,
  getCameraHeight,
  SITE_CAMERA_CLEARANCE,
  getTilesLift,
  getTilesTurn,
  isTilesLiftPlausible,
} from "../lib/site";

describe("the tiles", () => {
  // The tiles' north is +Z and west +X, and a turn about the vertical by
  // `angle` takes the point at (x, z) to this
  const turn = (angle: number, x: number, z: number) => ({
    x: x * Math.cos(angle) + z * Math.sin(angle),
    z: -x * Math.sin(angle) + z * Math.cos(angle),
  });

  it("put north at the scene's -Z and east at its +X", () => {
    const angle = getTilesTurn(0);
    const north = turn(angle, 0, 1);
    const east = turn(angle, -1, 0);
    expect(north.x).toBeCloseTo(0);
    expect(north.z).toBeCloseTo(-1);
    expect(east.x).toBeCloseTo(1);
    expect(east.z).toBeCloseTo(0);
  });

  it("put the site's heading at the scene's -Z", () => {
    const angle = getTilesTurn(90);
    // Due east, in the tiles
    const east = turn(angle, -1, 0);
    expect(east.x).toBeCloseTo(0);
    expect(east.z).toBeCloseTo(-1);
  });

  it("are raised or lowered to stand their ground on the scene's", () => {
    // Raised 2 ft already, their ground is found at 5 ft, and the scene's
    // ground is at -10 ft: they come down 15 ft, to -13
    expect(getTilesLift(5, 2, -10)).toBe(-13);
    // Already in place, they stay
    expect(getTilesLift(-10, -13, -10)).toBe(-13);
  });
});

describe("the tiles' ground", () => {
  it("is trusted within a few metres of the lot's height", () => {
    expect(isTilesLiftPlausible(0)).toBe(true);
    expect(isTilesLiftPlausible(-12)).toBe(true);
    expect(isTilesLiftPlausible(300)).toBe(true);
  });

  it("isn't when it's a coarse tile's, far under the real ground", () => {
    expect(isTilesLiftPlausible(217205)).toBe(false);
    expect(isTilesLiftPlausible(-1000)).toBe(false);
  });
});

describe("the orbiting camera", () => {
  it("is left where it is when it's clear of the ground", () => {
    expect(getCameraHeight(40, 10, 20)).toBe(40);
  });

  it("is raised out of a hillside, to just above it up close", () => {
    expect(getCameraHeight(5, 30, 20)).toBe(30 + SITE_CAMERA_CLEARANCE.least);
  });

  it("is kept higher over the ground the further out it is", () => {
    // 800 ft out, 120 ft over the ground
    expect(getCameraHeight(5, 30, 800)).toBeCloseTo(150);
  });
});

describe("the free tier", () => {
  it("spreads the month's free root requests over its longest possible run", () => {
    expect(DAILY_ROOT_REQUEST_CAP).toBe(32);
  });
});

describe("coordinates", () => {
  it("read with a hemisphere each, to four places", () => {
    expect(formatCoordinates(37.80393, -122.46538)).toBe(
      "37.8039° N, 122.4654° W"
    );
    expect(formatCoordinates(-33.8688, 151.2093)).toBe(
      "33.8688° S, 151.2093° E"
    );
  });
});
