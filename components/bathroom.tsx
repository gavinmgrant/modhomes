import { FLOOR, fronts, local, LocalPart, part, Part, place } from "./fixtures";
import type { Rect } from "./stair";

// Units are feet, and a room is the clear floor inside its walls. Both
// bathrooms run across the module, so x spans the room's width
export const DOOR_WIDTH = 2.5;

// Which side wall a bathroom's door is in (-1 or 1), and where along it
export type Door = { side: number; z: [number, number] };

export type Bathroom = { parts: Part[]; door: Door };

const TILE = 0.03;
// Tile and glass rise 7 ft
const SPLASH_TOP = FLOOR + 7;

// Close-coupled toilet, its tank against the wall
export const TOILET = { width: 1.6, depth: 2.3 };

const toilet = (): LocalPart[] => [
  local("porcelain", [-0.8, 0.8], [FLOOR + 1, FLOOR + 2.5], [0, 0.6]),
  local("porcelain", [-0.4, 0.4], [FLOOR, FLOOR + 1], [0.5, 2], true),
  local("porcelain", [-0.65, 0.65], [FLOOR + 1, FLOOR + 1.3], [0.4, 2.3], true),
];

// Floating walnut vanity with a quartz top, a vessel basin and a mirror
export const VANITY = { width: 2.5, depth: 1.83 };
const VANITY_TOP = FLOOR + 2.8;

const vanity = (): LocalPart[] => {
  const half = VANITY.width / 2;
  return [
    local("walnut", [-half, half], [FLOOR + 0.6, VANITY_TOP - 0.15], [0, 1.75]),
    ...fronts([-half, half], [FLOOR + 0.6, VANITY_TOP - 0.15], 1.75, 2, "top"),
    local("quartz", [-half, half], [VANITY_TOP - 0.15, VANITY_TOP], [0, 1.83]),
    local(
      "porcelain",
      [-0.6, 0.6],
      [VANITY_TOP, VANITY_TOP + 0.4],
      [0.45, 1.45],
      true,
    ),
    local(
      "stainless",
      [-0.04, 0.04],
      [VANITY_TOP, VANITY_TOP + 0.75],
      [0.2, 0.28],
    ),
    local(
      "stainless",
      [-0.04, 0.04],
      [VANITY_TOP + 0.67, VANITY_TOP + 0.75],
      [0.2, 0.65],
    ),
    local(
      "mirror",
      [-half + 0.2, half - 0.2],
      [FLOOR + 3.75, FLOOR + 6.5],
      [0, 0.04],
    ),
  ];
};

// 5 ft alcove tub: a porcelain shell around a lower floor, tiled above
export const TUB = { length: 5, width: 2.5 };
const TUB_TOP = FLOOR + 1.67;
const RIM = 0.3;

const tub = (): LocalPart[] => {
  const [half, w] = [TUB.length / 2, TUB.width];
  return [
    local("porcelain", [-half, half], [FLOOR, FLOOR + 0.4], [0, w]),
    local("porcelain", [-half, half], [FLOOR + 0.4, TUB_TOP], [0, RIM]),
    local("porcelain", [-half, half], [FLOOR + 0.4, TUB_TOP], [w - RIM, w]),
    local(
      "porcelain",
      [-half, -half + RIM],
      [FLOOR + 0.4, TUB_TOP],
      [RIM, w - RIM],
    ),
    local(
      "porcelain",
      [half - RIM, half],
      [FLOOR + 0.4, TUB_TOP],
      [RIM, w - RIM],
    ),
    local(
      "stainless",
      [-half + 0.55, -half + 0.65],
      [FLOOR + 2.1, FLOOR + 2.2],
      [0, 0.45],
    ),
    local("tile", [-half, half], [TUB_TOP, SPLASH_TOP], [0, TILE]),
    // the side wall at the tub's far end
    local("tile", [half - TILE, half], [TUB_TOP, SPLASH_TOP], [TILE, w]),
  ];
};

// 3 x 3.5 ft shower on a low tray, glass on its open side and part of its
// front, tiled on the two walls it stands against
export const SHOWER = { width: 3, depth: 3.5, entry: 1.5 };

const shower = (): LocalPart[] => {
  const [half, d] = [SHOWER.width / 2, SHOWER.depth];
  const tray = FLOOR + 0.2;
  return [
    local("porcelain", [-half, half], [FLOOR, tray], [0, d]),
    local("glass", [-half, -half + 0.03], [tray, SPLASH_TOP], [0, d]),
    local(
      "glass",
      [-half + SHOWER.entry, half],
      [tray, SPLASH_TOP],
      [d - 0.03, d],
    ),
    local("tile", [-half, half], [tray, SPLASH_TOP], [0, TILE]),
    local("tile", [half - TILE, half], [tray, SPLASH_TOP], [TILE, d]),
    local("stainless", [-0.04, 0.04], [FLOOR + 6.6, FLOOR + 6.68], [0, 0.7]),
    local(
      "stainless",
      [-0.3, 0.3],
      [FLOOR + 6.52, FLOOR + 6.6],
      [0.4, 1],
      true,
    ),
  ];
};

const floorTile = ({ x, z }: Rect) =>
  part("floorTile", x, [FLOOR, FLOOR + 0.02], z);

// Against the end wall: the vanity on the +x side and the toilet on the -x
// side. Against the far wall, the tub with a full-height linen cabinet
// beside it. The door is in the +x wall, between the two
export const getTubBath = (room: Rect): Bathroom => {
  const [[x0, x1], [z0, z1]] = [room.x, room.z];
  const tubX = x0 + TUB.length / 2;
  const linen: [number, number] = [x0 + TUB.length, x1];
  const front = z1 - TUB.width;
  const between = (z0 + VANITY.depth + front) / 2;
  return {
    parts: [
      floorTile(room),
      ...place(vanity(), [x1 - VANITY.width / 2, z0], "+z"),
      ...place(toilet(), [x0 + 1.5, z0], "+z"),
      // facing away from the far wall, so its end tile is on the -x wall
      ...place(tub(), [tubX, z1], "-z"),
      part("walnut", linen, [FLOOR, FLOOR + 7], [front + 0.06, z1]),
      ...place(
        fronts(
          [-(linen[1] - linen[0]) / 2, (linen[1] - linen[0]) / 2],
          [FLOOR + 0.05, FLOOR + 6.95],
          0,
          1,
        ),
        [(linen[0] + linen[1]) / 2, front + 0.06],
        "-z",
      ),
    ],
    door: { side: 1, z: [between - DOOR_WIDTH / 2, between + DOOR_WIDTH / 2] },
  };
};

// The shower in the +x corner against the tub bath, the toilet beside it on
// the -x side, and the vanity on the +x wall by the kitchen. The door is in
// the -x wall, opposite the vanity
export const getShowerBath = (room: Rect): Bathroom => {
  const [[x0, x1], [z0, z1]] = [room.x, room.z];
  const vanityZ = z1 - VANITY.width / 2;
  return {
    parts: [
      floorTile(room),
      ...place(shower(), [x1 - SHOWER.width / 2, z0], "+z"),
      ...place(toilet(), [x0 + 1.5, z0], "+z"),
      ...place(vanity(), [x1, vanityZ], "-x"),
    ],
    door: { side: -1, z: [z1 - 0.25 - DOOR_WIDTH, z1 - 0.25] },
  };
};
