import React, { useMemo } from "react";
import {
  CEILING,
  FLOOR,
  getFootprints,
  part,
  Part,
  Parts,
  pocketDoor,
  tileColors,
} from "./fixtures";
import {
  DOOR_HEIGHT,
  END_FACE,
  GALLEY_END,
  getGalleyLayout,
  getServicesLayout,
  getServicesModuleX,
  hasServices,
  SIDE_INNER,
  SIDE_OUTER,
  sideX,
  WALL,
} from "./services";
import { DOOR_INSET, DOOR_WIDTH, getHallBath, getShowerBath } from "./bathroom";
import { getPaneJoints, GLASS_REACH } from "./slidingdoors";
import { Box, getOpeningParts, getStairLayout, Rect } from "./stair";
import { MODULE, STORY_HEIGHT } from "../lib/dimensions";

// The bedrooms, the walk-in closets upstairs, and the bath stacked upstairs
// in two-story homes. Bedrooms need a window, and only the outermost
// modules have glass, along the home's long sides; the 8 ft ends are solid.
// So each bedroom has glass on one side, and runs from an end wall to the
// first joint in the glass doors, about 13 ft. A cross wall there carries on
// across the modules beside it until it meets the next wall: the services
// module's, the upstairs bath's, or the stair's, which runs up to the
// ceiling upstairs. Units are feet, in home coordinates, on a story's own
// floor: an upper story's are raised by STORY_HEIGHT when drawn

// Where a bedroom's cross wall stands, out from the middle column
export const ROOM_JOINT = getPaneJoints()[0];
// The front of the 2x2's upstairs bath, leaving a hall between it and the
// front bedroom
export const SHOWER_BATH_FRONT = -3.2;

type Side = -1 | 1;
type Span = [number, number];

export type Bedroom = {
  story: number;
  // The modules it takes, by index from the home's -x side, left to right
  modules: number[];
  // The end it's at: -1 the back, where the baths are, 1 the front
  end: Side;
  // Which module's cross wall has the door, and at which end of it, -1 or
  // 1; its leaf slides the other way, into the longer run of wall
  door: [number, Side];
  // Side walls it builds itself, over its own module's posts, where there's
  // no wall in the next module for its cross wall to meet
  sides: [number, Side][];
};

// The upstairs bath in two-story homes: over the tub bath in the services
// module, or in a 2x2 a shower bath over the galley's bath
export type UpperBath = "hall" | "shower" | null;

export type RoomPlan = { bedrooms: Bedroom[]; upperBath: UpperBath };

const bedroom = (
  story: number,
  modules: number[],
  end: Side,
  door: [number, Side],
  sides: [number, Side][] = [],
): Bedroom => ({ story, modules, end, door, sides });

// Each model's rooms. The 1x1 is one open room, for an office or a gym. A
// bedroom takes the modules beside it too where its cross wall can run on
// to a wall there, and still leave a way through to the others. The tub
// bath opens into the module to its +x side, so a bedroom there has it as
// its own bath. Upstairs, the front bedroom beside the stair shares its
// wall and has a walk-in closet beyond it, and in a 2x2 the back bedroom
// has one over the galley's closet too. A 4x2 has glass for only three
// bedrooms upstairs, so its fourth is on the ground floor
export const ROOM_PLANS: Record<string, RoomPlan> = {
  "1x1": { bedrooms: [], upperBath: null },
  "2x1": {
    bedrooms: [bedroom(0, [0], 1, [0, 1], [[0, 1]])],
    upperBath: null,
  },
  "3x1": { bedrooms: [bedroom(0, [2], -1, [2, -1])], upperBath: null },
  "4x1": {
    bedrooms: [bedroom(0, [0, 1], -1, [1, 1]), bedroom(0, [3], -1, [3, -1])],
    upperBath: null,
  },
  "5x1": {
    bedrooms: [
      bedroom(0, [0, 1], -1, [1, 1]),
      bedroom(0, [0], 1, [0, 1], [[0, 1]]),
      bedroom(0, [3, 4], -1, [3, -1]),
    ],
    upperBath: null,
  },
  "2x2": {
    bedrooms: [bedroom(1, [0], -1, [0, 1]), bedroom(1, [1], 1, [1, -1])],
    upperBath: "shower",
  },
  "3x2": {
    bedrooms: [
      bedroom(1, [0], -1, [0, 1]),
      bedroom(1, [2], -1, [2, -1]),
      bedroom(1, [1, 2], 1, [1, -1]),
    ],
    upperBath: "hall",
  },
  "4x2": {
    bedrooms: [
      bedroom(0, [3], -1, [3, -1]),
      bedroom(1, [0, 1], -1, [1, 1]),
      bedroom(1, [3], -1, [3, -1]),
      bedroom(1, [1, 2, 3], 1, [1, -1]),
    ],
    upperBath: "hall",
  },
};

export const getRoomPlan = (cols: number, stories: number): RoomPlan =>
  ROOM_PLANS[`${cols}x${stories}`] ?? { bedrooms: [], upperBath: null };

// The middle of module i, across x
export const getModuleX = (cols: number, i: number) =>
  -(MODULE.width / 2) * cols + MODULE.width / 2 + MODULE.width * i;

const shift = (parts: Part[], dx: number, dy = 0): Part[] =>
  parts.map((p) => ({
    ...p,
    position: [p.position[0] + dx, p.position[1] + dy, p.position[2]],
  }));

const spanOf = ({ position, size }: Box, axis: number): Span => [
  position[axis] - size[axis] / 2,
  position[axis] + size[axis] / 2,
];

const sorted = (a: number, b: number): Span => (a < b ? [a, b] : [b, a]);

const isWall = (part: Part) =>
  part.finish === "gyp" &&
  spanOf(part, 1)[0] < FLOOR + 0.01 &&
  spanOf(part, 1)[1] > CEILING - 0.01;

// A wall with a pocket door: full height either side of the doorway, a
// header over it, and the leaf slid into the wall toward `pocket`. The wall
// runs along `along` over `run`, through `across` on the other axis
const doorWall = (
  along: "x" | "z",
  run: Span,
  across: Span,
  door: Span,
  pocket: Side,
) => {
  const box = (a: Span, y: Span) =>
    along === "x" ? part("gyp", a, y, across) : part("gyp", across, y, a);
  return {
    walls: [
      box([run[0], door[0]], [FLOOR, CEILING]),
      box(door, [FLOOR + DOOR_HEIGHT, CEILING]),
      box([door[1], run[1]], [FLOOR, CEILING]),
    ],
    leaf: pocketDoor(
      along,
      door,
      (across[0] + across[1]) / 2,
      pocket,
      FLOOR + DOOR_HEIGHT,
    ),
  };
};

// One story's rooms, ready to draw
export type StoryRooms = {
  story: number;
  walls: Part[];
  // Bathroom fixtures
  fixtures: Part[];
  // Pocket door leaves
  leaves: Part[];
  // How long each bedroom and closet wall runs, door openings and all, for
  // pricing
  runs: number[];
  closets: number;
};

type Block = {
  walls: Part[];
  fixtures: Part[];
  leaves: Part[];
  runs: number[];
  closets: number;
};

const EMPTY: Block = {
  walls: [],
  fixtures: [],
  leaves: [],
  runs: [],
  closets: 0,
};

const join = (blocks: Block[]): Block => ({
  walls: blocks.flatMap((b) => b.walls),
  fixtures: blocks.flatMap((b) => b.fixtures),
  leaves: blocks.flatMap((b) => b.leaves),
  runs: blocks.flatMap((b) => b.runs),
  closets: blocks.reduce((sum, b) => sum + b.closets, 0),
});

// The stair's walls upstairs, on the upper story's own floor
export const getStairWalls = (cols: number): Part[] => {
  const { opening, glass } = getStairLayout(cols);
  return getOpeningParts(opening, glass).walls.map((box) => ({
    ...box,
    position: [
      box.position[0],
      box.position[1] - STORY_HEIGHT,
      box.position[2],
    ],
    finish: "gyp",
  }));
};

// The walk-in closet beyond the stair's far end upstairs, between the glass
// and the stair's +x wall, which carries on to the end wall with the door
// from the front bedroom in it
const getStairCloset = (cols: number): Block => {
  const { opening, glass } = getStairLayout(cols);
  const [right, far] = getOpeningParts(opening, glass).walls;
  const across = spanOf(right, 0);
  const run: Span = [spanOf(far, 2)[1], END_FACE];
  const door: Span = [run[0] + DOOR_INSET, run[0] + DOOR_INSET + DOOR_WIDTH];
  const front = doorWall("z", run, across, door, 1);
  return {
    walls: front.walls,
    // Against the glass, so left empty, without a shelf or rail
    fixtures: [],
    leaves: [front.leaf],
    runs: [run[1] - run[0]],
    closets: 1,
  };
};

// The bath stacked over the tub bath upstairs, with its own side walls and
// a front wall level with the bedrooms' cross walls, opening onto the hall
const getUpperHallBath = (cols: number): Block => {
  const mx = getServicesModuleX(cols);
  const room: Rect = {
    x: [mx - SIDE_INNER, mx + SIDE_INNER],
    z: [-END_FACE, -ROOM_JOINT - WALL / 2],
  };
  const bath = getHallBath(room);
  const front = doorWall(
    "x",
    room.x,
    [-ROOM_JOINT - WALL / 2, -ROOM_JOINT + WALL / 2],
    bath.doorX,
    -1,
  );
  return {
    walls: [
      ...([-1, 1] as Side[]).map((side) =>
        part(
          "gyp",
          sideX(side).map((x) => x + mx) as Span,
          [FLOOR, CEILING],
          [-END_FACE, -ROOM_JOINT + WALL / 2],
        ),
      ),
      ...front.walls,
    ],
    fixtures: bath.parts,
    leaves: [front.leaf],
    runs: [],
    closets: 0,
  };
};

// The 2x2's upstairs, over the galley in the +x module: a shower bath over
// the galley's bath, against the same sided panes, opening onto the
// landing, and behind it a walk-in closet to the end wall, opening into the
// back bedroom. Both doors are in the wall along the module's -x side
const getUpperShowerBath = (cols: number): Block => {
  const mx = getServicesModuleX(cols);
  const inner: Span = [mx - SIDE_INNER, mx + SIDE_INNER];
  const back: Span = [GALLEY_END - WALL / 2, GALLEY_END + WALL / 2];
  const front: Span = [
    SHOWER_BATH_FRONT - WALL / 2,
    SHOWER_BATH_FRONT + WALL / 2,
  ];
  const room: Rect = { x: inner, z: [back[1], front[0]] };
  const bath = getShowerBath(room);
  const closetDoor: Span = [
    back[0] - DOOR_INSET - DOOR_WIDTH,
    back[0] - DOOR_INSET,
  ];
  const leftX = sideX(-1).map((x) => x + mx) as Span;
  // The -x wall, from the end wall to the bath's front, with both doors
  const closetPart = doorWall("z", [-END_FACE, back[0]], leftX, closetDoor, -1);
  const bathPart = doorWall(
    "z",
    [back[0], front[1]],
    leftX,
    bath.door.z as Span,
    -1,
  );
  return {
    walls: [
      ...closetPart.walls,
      ...bathPart.walls,
      part(
        "gyp",
        sideX(1).map((x) => x + mx) as Span,
        [FLOOR, CEILING],
        [back[0], front[1]],
      ),
      part("gyp", inner, [FLOOR, CEILING], back),
      part("gyp", inner, [FLOOR, CEILING], front),
    ],
    // The closet's against the glass, so it's left empty
    fixtures: bath.parts,
    leaves: [closetPart.leaf, bathPart.leaf],
    runs: [END_FACE + back[0]],
    closets: 1,
  };
};

// The ground floor's walls standing already, in home coordinates
const getGroundWalls = (cols: number) => {
  const layout = getServicesLayout(cols) ?? getGalleyLayout(cols);
  return layout ? shift(layout.walls, layout.moduleX) : [];
};

// A bedroom's walls and door, meeting the walls standing on its story
const getBedroom = (cols: number, room: Bedroom, standing: Part[]): Block => {
  const { modules, end, sides } = room;
  const walls: Part[] = [];
  const leaves: Part[] = [];
  const runs: number[] = [];
  const ownSide = (m: number, side: Side) =>
    sides.some(([sm, s]) => sm === m && s === side);
  const crossZ = end * ROOM_JOINT;
  const across: Span = [crossZ - WALL / 2, crossZ + WALL / 2];

  // Where the cross wall ends on one side of module m: against its own side
  // wall, at the glass, where it meets its next module's, or on at the
  // first wall standing in the next module
  const endAt = (m: number, side: Side) => {
    const mx = getModuleX(cols, m);
    const edge = mx + side * (MODULE.width / 2);
    if (ownSide(m, side)) return mx + side * SIDE_INNER;
    if ((m === 0 && side < 0) || (m === cols - 1 && side > 0)) {
      return edge + side * GLASS_REACH;
    }
    if (modules.includes(m + side)) return edge;
    const faces = standing
      .filter((wall) => {
        const [z0, z1] = spanOf(wall, 2);
        const [x0, x1] = spanOf(wall, 0);
        const near = side > 0 ? x0 : x1;
        return (
          isWall(wall) &&
          z0 <= crossZ + 1e-6 &&
          crossZ <= z1 + 1e-6 &&
          side * (near - edge) > -1e-6 &&
          side * (near - edge) < MODULE.width
        );
      })
      .map((wall) => (side > 0 ? spanOf(wall, 0)[0] : spanOf(wall, 0)[1]));
    if (!faces.length) return edge;
    return side > 0 ? Math.min(...faces) : Math.max(...faces);
  };

  modules.forEach((m) => {
    const run: Span = [endAt(m, -1), endAt(m, 1)];
    runs.push(run[1] - run[0]);
    const [dm, side] = room.door;
    if (m !== dm) {
      walls.push(part("gyp", run, [FLOOR, CEILING], across));
      return;
    }
    const door: Span =
      side < 0
        ? [run[0] + DOOR_INSET, run[0] + DOOR_INSET + DOOR_WIDTH]
        : [run[1] - DOOR_INSET - DOOR_WIDTH, run[1] - DOOR_INSET];
    const built = doorWall("x", run, across, door, -side as Side);
    walls.push(...built.walls);
    leaves.push(built.leaf);
  });

  // Side walls run from the end wall to the cross wall's far face, so the
  // cross wall stops against them
  const along = sorted(end * (ROOM_JOINT - WALL / 2), end * END_FACE);
  sides.forEach(([m, side]) => {
    const x = sideX(side).map((x) => x + getModuleX(cols, m)) as Span;
    walls.push(part("gyp", x, [FLOOR, CEILING], along));
    runs.push(along[1] - along[0]);
  });

  return { walls, fixtures: [], leaves, runs, closets: 0 };
};

// Every story's rooms, ground floor first
export const getRoomsLayout = (cols: number, stories: number): StoryRooms[] => {
  const plan = getRoomPlan(cols, stories);
  const upper =
    stories < 2
      ? EMPTY
      : join([
          plan.upperBath === "hall" && hasServices(cols)
            ? getUpperHallBath(cols)
            : plan.upperBath === "shower"
              ? getUpperShowerBath(cols)
              : EMPTY,
          getStairCloset(cols),
        ]);
  return Array.from({ length: stories }, (_, story) => {
    const base = story > 0 ? upper : EMPTY;
    const standing =
      story > 0
        ? [...base.walls, ...getStairWalls(cols)]
        : getGroundWalls(cols);
    const rooms = plan.bedrooms
      .filter((room) => room.story === story)
      .map((room) => getBedroom(cols, room, standing));
    return { story, ...join([base, ...rooms]) };
  });
};

// What there is to walk around on the ground floor, the only one walked
export const getRoomsBlocks = (cols: number, stories: number) => {
  const ground = getRoomsLayout(cols, stories)[0];
  return getFootprints([...ground.walls, ...ground.fixtures, ...ground.leaves]);
};

interface RoomsProps {
  cols: number;
  stories: number;
  tileColor?: string;
}

const Rooms = ({ cols, stories, tileColor }: RoomsProps) => {
  const layout = useMemo(() => getRoomsLayout(cols, stories), [cols, stories]);
  const colors = tileColor ? tileColors(tileColor) : undefined;
  return (
    <>
      {layout.map(({ story, walls, fixtures, leaves }) => (
        <group key={story} position={[0, STORY_HEIGHT * story, 0]}>
          <Parts parts={walls} />
          <Parts parts={fixtures} colors={colors} />
          <Parts parts={leaves} />
        </group>
      ))}
    </>
  );
};

export default Rooms;
