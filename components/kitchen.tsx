import { getSlabPieces } from "./module";
import {
  CEILING,
  FLOOR,
  fronts,
  local,
  LocalPart,
  part,
  Part,
  place,
} from "./fixtures";
import type { Rect } from "./stair";

// Units are feet. Base cabinets are 2 ft deep with a 36" quartz counter;
// wall cabinets start 18" above it and run up to the ceiling
const COUNTER_TOP = FLOOR + 3;
const COUNTER = 0.12;
const BASE_DEPTH = 1.94;
export const COUNTER_DEPTH = 2.08;
const UPPER = { bottom: COUNTER_TOP + 1.5, depth: 1.17 };
// A 30" range, centred on the end wall run
const RANGE_HALF = 1.25;
// Clear floor between the island and the end wall run
export const AISLE = 3.5;
export const ISLAND = { length: 7, depth: 3.5, overhang: 1 };
// 26" to the top of a 1" seat, on a 5/8" base
export const STOOL = { height: 26 / 12, seat: 1 / 12, base: 0.05 };
export const TALL_DEPTH = 2.25;
const FRIDGE_WIDTH = 3;

// Stainless tile on the backsplash, 3" high by 6" wide in a stacked grid:
// 3/16" grout lines standing just proud of its face, the columns centred on
// the run so the cut tiles at each end match, and the rows from the counter up
const TILE = { width: 6 / 12, height: 3 / 12, grout: 3 / 16 / 12 };
const SPLASH_DEPTH = 0.03;

const tileGrid = (half: number): LocalPart[] => {
  const face: [number, number] = [SPLASH_DEPTH, SPLASH_DEPTH + 0.005];
  const g = TILE.grout / 2;
  const rows: LocalPart[] = [];
  for (
    let y = COUNTER_TOP + TILE.height;
    y < UPPER.bottom - g;
    y += TILE.height
  ) {
    rows.push(local("grout", [-half, half], [y - g, y + g], face));
  }
  const columns: LocalPart[] = [];
  for (
    let u = Math.ceil(-half / TILE.width) * TILE.width;
    u < half;
    u += TILE.width
  ) {
    columns.push(
      local("grout", [u - g, u + g], [COUNTER_TOP, UPPER.bottom], face),
    );
  }
  return [...rows, ...columns];
};

// Against the end wall, like the photo: base cabinets and a stainless range
// with dark burners, under a stainless tile backsplash and a full run of wall
// cabinets with a hood
const rangeRun = (half: number): LocalPart[] => {
  const sides = [
    [-half, -RANGE_HALF],
    [RANGE_HALF, half],
  ] as [number, number][];
  const cooktop = COUNTER_TOP - 0.05;
  return [
    ...sides.flatMap((u) => [
      local("walnut", u, [FLOOR, COUNTER_TOP - COUNTER], [0, BASE_DEPTH]),
      ...fronts(
        u,
        [FLOOR + 0.35, COUNTER_TOP - COUNTER - 0.05],
        BASE_DEPTH,
        2,
        "top",
      ),
      local(
        "quartz",
        u,
        [COUNTER_TOP - COUNTER, COUNTER_TOP],
        [0, COUNTER_DEPTH],
      ),
    ]),
    local(
      "stainless",
      [-RANGE_HALF, RANGE_HALF],
      [FLOOR, cooktop],
      [0, COUNTER_DEPTH],
    ),
    local("stainless", [-1.2, 1.2], [cooktop, COUNTER_TOP], [0.05, 2]),
    ...[-0.6, 0.6].flatMap((u) =>
      [0.55, 1.45].map((d) =>
        local(
          "cooktop",
          [u - 0.3, u + 0.3],
          [COUNTER_TOP, COUNTER_TOP + 0.02],
          [d - 0.3, d + 0.3],
          true,
        ),
      ),
    ),
    local(
      "cooktop",
      [-0.9, 0.9],
      [FLOOR + 0.9, FLOOR + 2.1],
      [COUNTER_DEPTH, COUNTER_DEPTH + 0.02],
    ),
    local(
      "stainless",
      [-1, 1],
      [FLOOR + 2.35, FLOOR + 2.43],
      [COUNTER_DEPTH + 0.02, COUNTER_DEPTH + 0.12],
    ),
    local(
      "stainless",
      [-half, half],
      [COUNTER_TOP, UPPER.bottom],
      [0, SPLASH_DEPTH],
    ),
    ...tileGrid(half),
    local("walnut", [-half, half], [UPPER.bottom, CEILING], [0, UPPER.depth]),
    ...fronts(
      [-half, half],
      [UPPER.bottom + 0.02, CEILING - 0.02],
      UPPER.depth,
      4,
      "bottom",
    ),
    local(
      "stainless",
      [-RANGE_HALF, RANGE_HALF],
      [UPPER.bottom - 0.2, UPPER.bottom],
      [0, 1.7],
    ),
  ];
};

// Full-height wall of cabinets on the bathrooms' kitchen face, between the
// bathroom walls where they run forward around the middle columns: a pantry
// and a stainless French door fridge with a cabinet above
const tallUnit = (half: number): LocalPart[] => {
  const face = TALL_DEPTH - 0.06;
  const fridge: [number, number] = [half - 0.1 - FRIDGE_WIDTH, half - 0.1];
  const middle = (fridge[0] + fridge[1]) / 2;
  const handle = (u: number) =>
    local(
      "stainless",
      [u - 0.025, u + 0.025],
      [FLOOR + 3.2, FLOOR + 5.3],
      [face + 0.06, face + 0.16],
    );
  return [
    local("walnut", [-half, half], [FLOOR, CEILING], [0, face]),
    ...fronts(
      [-half + 0.03, fridge[0] - 0.05],
      [FLOOR + 0.3, CEILING - 0.03],
      face,
      2,
    ),
    ...fronts(
      fridge,
      [FLOOR + 0.3, FLOOR + 2.4],
      face,
      1,
      undefined,
      "stainless",
    ),
    local(
      "stainless",
      [fridge[0] + 0.4, fridge[1] - 0.4],
      [FLOOR + 2.1, FLOOR + 2.17],
      [face + 0.06, face + 0.16],
    ),
    ...fronts(
      fridge,
      [FLOOR + 2.45, FLOOR + 6],
      face,
      2,
      undefined,
      "stainless",
    ),
    handle(middle - 0.15),
    handle(middle + 0.15),
    ...fronts(fridge, [FLOOR + 6.05, CEILING - 0.03], face, 2, "bottom"),
  ];
};

// The island runs across the module like the plan's, with an undermount
// sink and the dishwasher on the aisle side and stools along the other
const island = (z1: number): Part[] => {
  const half = ISLAND.length / 2;
  const z0 = z1 - ISLAND.depth;
  const base: [number, number] = [z0 + ISLAND.overhang, z1 - 0.16];
  const counter = COUNTER_TOP - COUNTER;
  // the sink sits toward the aisle, in counter coordinates centred on 0
  const sink = {
    x: [-1.25, 1.25] as [number, number],
    z: [0.05, 1.45] as [number, number],
  };
  const centerZ = (z0 + z1) / 2;
  const [sz0, sz1] = sink.z.map((z) => centerZ + z);
  const bowl = counter - 0.7;
  const drawers = [FLOOR + 0.35, FLOOR + 1.2, FLOOR + 2.05, counter - 0.05];
  // the base is open under the sink's hole, down to the bottom of its bowl
  const baseCenter = (base[0] + base[1]) / 2;
  const baseHole: Rect = {
    x: sink.x,
    z: [sz0 - baseCenter, sz1 - baseCenter],
  };
  return [
    ...getSlabPieces(ISLAND.length, base[1] - base[0], baseHole).map(
      ({ x, z, width, depth }) =>
        part(
          "walnut",
          [x - width / 2, x + width / 2],
          [FLOOR, counter],
          [baseCenter + z - depth / 2, baseCenter + z + depth / 2],
        ),
    ),
    part("walnut", sink.x, [FLOOR, bowl - 0.03], [sz0, sz1]),
    ...getSlabPieces(ISLAND.length + 0.2, ISLAND.depth, sink).map(
      ({ x, z, width, depth }) =>
        part(
          "quartz",
          [x - width / 2, x + width / 2],
          [counter, COUNTER_TOP],
          [centerZ + z - depth / 2, centerZ + z + depth / 2],
        ),
    ),
    // the sink bowl under the counter, and a gooseneck faucet behind it
    part("stainless", sink.x, [bowl - 0.03, bowl], [sz0, sz1]),
    part("stainless", sink.x, [bowl, counter], [sz0, sz0 + 0.03]),
    part("stainless", sink.x, [bowl, counter], [sz1 - 0.03, sz1]),
    part("stainless", [-1.25, -1.22], [bowl, counter], [sz0, sz1]),
    part("stainless", [1.22, 1.25], [bowl, counter], [sz0, sz1]),
    part(
      "stainless",
      [-0.06, 0.06],
      [COUNTER_TOP, COUNTER_TOP + 1.2],
      [sz0 - 0.27, sz0 - 0.15],
      true,
    ),
    part(
      "stainless",
      [-0.04, 0.04],
      [COUNTER_TOP + 1.12, COUNTER_TOP + 1.2],
      [sz0 - 0.21, sz0 + 0.45],
    ),
    ...place(
      [
        ...drawers
          .slice(1)
          .flatMap((top, i) =>
            fronts([-half, -1.5], [drawers[i], top - 0.05], 0, 1, "top"),
          ),
        ...fronts([-1.5, 1.5], [FLOOR + 0.35, counter - 0.05], 0, 2, "top"),
        ...fronts(
          [1.5, half],
          [FLOOR + 0.35, counter - 0.05],
          0,
          1,
          undefined,
          "stainless",
        ),
        local(
          "stainless",
          [1.8, half - 0.3],
          [counter - 0.3, counter - 0.22],
          [0.06, 0.16],
        ),
      ],
      [0, base[1]],
      "+z",
    ),
    // stools with a thin seat on a thin disc base, tucked under the overhang
    ...[-2.25, 0, 2.25].flatMap((x) => [
      part(
        "stainless",
        [x - 0.55, x + 0.55],
        [FLOOR, FLOOR + STOOL.base],
        [z0 - 0.65, z0 + 0.45],
        true,
      ),
      part(
        "stainless",
        [x - 0.08, x + 0.08],
        [FLOOR + STOOL.base, FLOOR + STOOL.height - STOOL.seat],
        [z0 - 0.18, z0 - 0.02],
        true,
      ),
      part(
        "walnut",
        [x - 0.6, x + 0.6],
        [FLOOR + STOOL.height - STOOL.seat, FLOOR + STOOL.height],
        [z0 - 0.7, z0 + 0.5],
        true,
      ),
    ]),
  ];
};

// The kitchen fills the module from the bathrooms' front face to the end
// wall: tall cabinets on the bathrooms, then open floor, the island, the
// aisle and the range run
export const getKitchenParts = ({ x, z: [z0, z1] }: Rect): Part[] => {
  const half = (x[1] - x[0]) / 2;
  const centerX = (x[0] + x[1]) / 2;
  const islandFront = z1 - COUNTER_DEPTH - AISLE;
  return [
    ...place(tallUnit(half), [centerX, z0], "+z"),
    ...island(islandFront),
    ...place(rangeRun(half), [centerX, z1], "-z"),
  ];
};
