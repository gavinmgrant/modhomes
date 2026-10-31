import { getSlabPieces } from "./module";
import {
  CEILING,
  doors,
  DRAWER_HEIGHT,
  drawersOverDoors,
  Facing,
  FLOOR,
  fronts,
  local,
  LocalPart,
  part,
  Part,
  place,
  placePoint,
} from "./fixtures";
import type { Rect } from "./stair";
import type { StoolSpot } from "./stool";
import type { ApplianceId } from "../lib/appliances";

// Units are feet. Base cabinets are 2 ft deep with a 36" quartz counter;
// wall cabinets start 18" above it and run up to the ceiling
const COUNTER_TOP = FLOOR + 3;
const COUNTER = 0.12;
const BASE_DEPTH = 1.94;
export const COUNTER_DEPTH = 2.08;
const UPPER = { bottom: COUNTER_TOP + 1.5, depth: 1.17 };
// A 30" range, centred on the end wall run
const RANGE_HALF = 1.25;
// The hood's canopy runs out this far from the wall
const HOOD_DEPTH = 1.7;
// Clear floor between the island and the end wall run
export const AISLE = 3.5;
export const ISLAND = { length: 7, depth: 3.5, overhang: 1 };
export const TALL_DEPTH = 2.25;
const FRIDGE_WIDTH = 3;
// The island's counter overhangs its base on the aisle side by 2"
const ISLAND_LIP = 0.16;

// Each appliance's spec dot sits just proud of its front, at a height
// on the part of it people know it by: the oven door, the hood's front
// edge, the middle of the dishwasher door and the fridge's upper doors
export type Spot = {
  appliance: ApplianceId;
  position: [number, number, number];
  // the way its appliance faces, so the dot shows only from in front of it
  facing: Facing;
};
const PROUD = 0.01;
const SPOT_Y = {
  range: FLOOR + 1.5,
  hood: UPPER.bottom - 0.1,
  dishwasher: FLOOR + 1.6,
  fridge: FLOOR + 4.25,
};

const spot = (
  appliance: ApplianceId,
  point: [number, number, number],
  at: [number, number],
  facing: Facing,
): Spot => ({ appliance, position: placePoint(point, at, facing), facing });

// Wall tile on the backsplash, the same as the bathrooms', 3" high by 6" wide in a stacked grid:
// 3/16" grout lines standing just proud of its face, the columns centred on
// the run so the cut tiles at each end match, and the rows from the counter up
const TILE = { width: 6 / 12, height: 3 / 12, grout: 3 / 16 / 12 };
const SPLASH_DEPTH = 0.03;

type Span = [number, number];

const tileGrid = ([u0, u1]: Span): LocalPart[] => {
  const face: Span = [SPLASH_DEPTH, SPLASH_DEPTH + 0.005];
  const g = TILE.grout / 2;
  const middle = (u0 + u1) / 2;
  const rows: LocalPart[] = [];
  for (
    let y = COUNTER_TOP + TILE.height;
    y < UPPER.bottom - g;
    y += TILE.height
  ) {
    rows.push(local("grout", [u0, u1], [y - g, y + g], face));
  }
  const columns: LocalPart[] = [];
  for (
    let u = middle + Math.ceil((u0 - middle) / TILE.width) * TILE.width;
    u < u1;
    u += TILE.width
  ) {
    columns.push(
      local("grout", [u - g, u + g], [COUNTER_TOP, UPPER.bottom], face),
    );
  }
  return [...rows, ...columns];
};

// Base cabinet fronts run from the toe kick to just under the counter, a
// drawer over each door
const BASE_FRONTS: Span = [FLOOR + 0.35, COUNTER_TOP - COUNTER - 0.05];

// A base cabinet with a quartz counter, `count` doors across; a lone door
// opens toward `lone`
const baseCabinet = (u: Span, count: number, lone: -1 | 1 = 1): LocalPart[] => [
  local("walnut", u, [FLOOR, COUNTER_TOP - COUNTER], [0, BASE_DEPTH]),
  ...drawersOverDoors(u, BASE_FRONTS, BASE_DEPTH, count, lone),
  local("quartz", u, [COUNTER_TOP - COUNTER, COUNTER_TOP], [0, COUNTER_DEPTH]),
];

// A 30" stainless induction range centred on c, with a flat black glass
// top inset in a thin stainless rim, and a dark oven door
const range = (c: number): LocalPart[] => {
  const cooktop = COUNTER_TOP - 0.05;
  return [
    local(
      "stainless",
      [c - RANGE_HALF, c + RANGE_HALF],
      [FLOOR, cooktop],
      [0, COUNTER_DEPTH],
    ),
    local("cooktop", [c - 1.2, c + 1.2], [cooktop, COUNTER_TOP], [0.05, 2]),
    local(
      "cooktop",
      [c - 0.9, c + 0.9],
      [FLOOR + 0.9, FLOOR + 2.1],
      [COUNTER_DEPTH, COUNTER_DEPTH + 0.02],
    ),
    local(
      "stainless",
      [c - 1, c + 1],
      [FLOOR + 2.35, FLOOR + 2.43],
      [COUNTER_DEPTH + 0.02, COUNTER_DEPTH + 0.12],
    ),
  ];
};

// The tile backsplash and a run of wall cabinets above it, up to
// the ceiling, with a stainless hood over the range at c
const uppers = (u: Span, c: number): LocalPart[] => [
  local("tile", u, [COUNTER_TOP, UPPER.bottom], [0, SPLASH_DEPTH]),
  ...tileGrid(u),
  local("walnut", u, [UPPER.bottom, CEILING], [0, UPPER.depth]),
  ...doors(
    u,
    [UPPER.bottom + 0.02, CEILING - 0.02],
    UPPER.depth,
    Math.round((u[1] - u[0]) / 1.75),
    "bottom",
  ),
  local(
    "stainless",
    [c - RANGE_HALF, c + RANGE_HALF],
    [UPPER.bottom - 0.2, UPPER.bottom],
    [0, HOOD_DEPTH],
  ),
];

// Against the end wall, like the photo: base cabinets either side of the
// range, under a tile backsplash and a full run of wall cabinets
// with a hood
const rangeRun = (half: number): LocalPart[] => [
  ...baseCabinet([-half, -RANGE_HALF], 2),
  ...baseCabinet([RANGE_HALF, half], 2),
  ...range(0),
  ...uppers([-half, half], 0),
];

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
    ...doors(fridge, [FLOOR + 6.05, CEILING - 0.03], face, 2, "bottom"),
  ];
};

// The island runs across the module like the plan's, with an undermount
// sink and the dishwasher on the aisle side and stools along the other
const island = (z1: number): Part[] => {
  const half = ISLAND.length / 2;
  const z0 = z1 - ISLAND.depth;
  const base: [number, number] = [z0 + ISLAND.overhang, z1 - ISLAND_LIP];
  const counter = COUNTER_TOP - COUNTER;
  // the sink sits toward the aisle, in counter coordinates centred on 0
  const sink = {
    x: [-1.25, 1.25] as [number, number],
    z: [0.05, 1.45] as [number, number],
  };
  const centerZ = (z0 + z1) / 2;
  const [sz0, sz1] = sink.z.map((z) => centerZ + z);
  const bowl = counter - 0.7;
  // a stack of drawers, the top one in line with the drawers over the doors
  const split = counter - 0.05 - DRAWER_HEIGHT;
  const drawers = [FLOOR + 0.35, (FLOOR + 0.35 + split) / 2, split, counter];
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
        ...drawersOverDoors([-1.5, 1.5], BASE_FRONTS, 0, 2),
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
  ];
};

// Three stools along the island's overhang, facing it, their bases set
// back from its edge so the seats' front lips tuck under the counter
const STOOL_SET_BACK = 0.35;

export const getStools = ({ z: [, z1] }: Rect): StoolSpot[] => {
  const overhang = z1 - COUNTER_DEPTH - AISLE - ISLAND.depth;
  return [-2.25, 0, 2.25].map((x) => ({
    x,
    z: overhang - STOOL_SET_BACK,
    facing: 1,
  }));
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

// The galley's widths from the closet end, like the plan: a base cabinet,
// the range, a filler cabinet, the sink, the dishwasher, then a counter-depth
// fridge filling the rest up to the bath's wall
const GALLEY = { base: 1.95, filler: 1, sink: 2.5, dishwasher: 2 };
// A 24" undermount bowl, in the sink cabinet's counter coordinates
const GALLEY_SINK = { u: [-1, 1] as Span, d: [0.45, 1.65] as Span };

const sinkCabinet = ([u0, u1]: Span): LocalPart[] => {
  const c = (u0 + u1) / 2;
  const counter = COUNTER_TOP - COUNTER;
  const bowl = counter - 0.7;
  const [s0, s1] = GALLEY_SINK.u.map((u) => c + u);
  const [d0, d1] = GALLEY_SINK.d;
  const middle = COUNTER_DEPTH / 2;
  const hole: Rect = {
    x: GALLEY_SINK.u,
    z: [d0 - middle, d1 - middle],
  };
  return [
    // the carcass stops below the bowl
    local("walnut", [u0, u1], [FLOOR, bowl - 0.03], [0, BASE_DEPTH]),
    ...drawersOverDoors([u0, u1], BASE_FRONTS, BASE_DEPTH, 2),
    ...getSlabPieces(u1 - u0, COUNTER_DEPTH, hole).map(
      ({ x, z, width, depth }) =>
        local(
          "quartz",
          [c + x - width / 2, c + x + width / 2],
          [counter, COUNTER_TOP],
          [middle + z - depth / 2, middle + z + depth / 2],
        ),
    ),
    local("stainless", [s0, s1], [bowl - 0.03, bowl], [d0, d1]),
    local("stainless", [s0, s1], [bowl, counter], [d0, d0 + 0.03]),
    local("stainless", [s0, s1], [bowl, counter], [d1 - 0.03, d1]),
    local("stainless", [s0, s0 + 0.03], [bowl, counter], [d0, d1]),
    local("stainless", [s1 - 0.03, s1], [bowl, counter], [d0, d1]),
    // a gooseneck faucet behind the bowl
    local(
      "stainless",
      [c - 0.06, c + 0.06],
      [COUNTER_TOP, COUNTER_TOP + 1.2],
      [d0 - 0.27, d0 - 0.15],
      true,
    ),
    local(
      "stainless",
      [c - 0.04, c + 0.04],
      [COUNTER_TOP + 1.12, COUNTER_TOP + 1.2],
      [d0 - 0.21, d0 + 0.45],
    ),
  ];
};

const dishwasher = (u: Span): LocalPart[] => {
  const counter = COUNTER_TOP - COUNTER;
  return [
    local("walnut", u, [FLOOR, counter], [0, BASE_DEPTH]),
    ...fronts(
      u,
      [FLOOR + 0.35, counter - 0.05],
      BASE_DEPTH,
      1,
      undefined,
      "stainless",
    ),
    local(
      "stainless",
      [u[0] + 0.3, u[1] - 0.3],
      [counter - 0.3, counter - 0.22],
      [BASE_DEPTH + 0.08, BASE_DEPTH + 0.14],
    ),
    local("quartz", u, [counter, COUNTER_TOP], [0, COUNTER_DEPTH]),
  ];
};

// Bottom freezer fridge as deep as the counter, with a cabinet above it to
// the ceiling, hinged on the wall side
const counterDepthFridge = ([u0, u1]: Span): LocalPart[] => {
  const face = COUNTER_DEPTH - 0.06;
  const fridge: Span = [u0 + 0.02, u1 - 0.02];
  return [
    local("walnut", [u0, u1], [FLOOR, CEILING], [0, face]),
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
      [face + 0.06, face + 0.12],
    ),
    ...fronts(
      fridge,
      [FLOOR + 2.45, FLOOR + 6],
      face,
      1,
      undefined,
      "stainless",
    ),
    local(
      "stainless",
      [fridge[0] + 0.12, fridge[0] + 0.17],
      [FLOOR + 3.2, FLOOR + 5.3],
      [face + 0.06, face + 0.12],
    ),
    // hinged on the wall side, like the fridge
    ...doors(fridge, [FLOOR + 6.05, CEILING - 0.03], face, 1, "bottom", -1),
  ];
};

const galleySpans = (length: number) => {
  let u = -length / 2;
  const next = (width: number): Span => [u, (u += width)];
  const base = next(GALLEY.base);
  const stove = next(2 * RANGE_HALF);
  const filler = next(GALLEY.filler);
  const sink = next(GALLEY.sink);
  const dw = next(GALLEY.dishwasher);
  const fridge: Span = [u, length / 2];
  const c = (stove[0] + stove[1]) / 2;
  return { base, filler, sink, dw, fridge, c };
};

const galleyRun = (length: number): LocalPart[] => {
  const { base, filler, sink, dw, fridge, c } = galleySpans(length);
  return [
    ...baseCabinet(base, 2),
    ...range(c),
    ...baseCabinet(filler, 1),
    ...sinkCabinet(sink),
    ...dishwasher(dw),
    ...counterDepthFridge(fridge),
    ...uppers([base[0], dw[1]], c),
  ];
};

// A one-wall galley along the face at x, from z0 to z1, facing -x: the
// fridge at z1, the range toward z0
export const getGalleyParts = (x: number, [z0, z1]: Span): Part[] =>
  place(galleyRun(z1 - z0), [x, (z0 + z1) / 2], "-x");

// The range's dot on its oven door and the hood's on its front edge, for a
// range centred on c
type LocalSpot = [ApplianceId, [number, number, number]];

const cookingSpots = (c: number): LocalSpot[] => [
  ["range", [c, SPOT_Y.range, COUNTER_DEPTH + 0.02 + PROUD]],
  ["hood", [c, SPOT_Y.hood, HOOD_DEPTH + PROUD]],
];

const placeSpots = (
  spots: LocalSpot[],
  at: [number, number],
  facing: Facing,
): Spot[] =>
  spots.map(([appliance, point]) => spot(appliance, point, at, facing));

// The dots in the full kitchen: the range and hood on the end wall run, the
// dishwasher on the island's aisle side, and the French door fridge's left
// door in the tall unit
export const getKitchenSpots = ({ x, z: [z0, z1] }: Rect): Spot[] => {
  const half = (x[1] - x[0]) / 2;
  const centerX = (x[0] + x[1]) / 2;
  const islandBack = z1 - COUNTER_DEPTH - AISLE - ISLAND_LIP;
  const fridgeDoor = half - 0.1 - (FRIDGE_WIDTH * 3) / 4;
  return [
    ...placeSpots(cookingSpots(0), [centerX, z1], "-z"),
    ...placeSpots(
      [
        [
          "dishwasher",
          [(1.5 + ISLAND.length / 2) / 2, SPOT_Y.dishwasher, 0.06 + PROUD],
        ],
      ],
      [0, islandBack],
      "+z",
    ),
    ...placeSpots(
      [["frenchDoorFridge", [fridgeDoor, SPOT_Y.fridge, TALL_DEPTH + PROUD]]],
      [centerX, z0],
      "+z",
    ),
  ];
};

// The galley's dots, along the same face as its parts
export const getGalleySpots = (x: number, [z0, z1]: Span): Spot[] => {
  const { dw, fridge, c } = galleySpans(z1 - z0);
  const middle = ([a, b]: Span) => (a + b) / 2;
  return placeSpots(
    [
      ...cookingSpots(c),
      [
        "dishwasher",
        [middle(dw), SPOT_Y.dishwasher, BASE_DEPTH + 0.06 + PROUD],
      ],
      [
        "bottomFreezerFridge",
        [middle(fridge), SPOT_Y.fridge, COUNTER_DEPTH + PROUD],
      ],
    ],
    [x, (z0 + z1) / 2],
    "-x",
  );
};
