import React from "react";
import { POST_INSET } from "./module";
import {
  CEILING,
  FLOOR,
  getFootprints,
  part,
  Part,
  Parts,
  tileColors,
  tileFloor,
} from "./fixtures";
import {
  Door,
  DOOR_INSET,
  DOOR_WIDTH,
  getGalleyBath,
  getShowerBath,
  getTubBath,
} from "./bathroom";
import {
  COUNTER_DEPTH,
  getGalleyParts,
  getKitchenParts,
  getStools,
  TALL_DEPTH,
} from "./kitchen";
import { getPaneJoints, getPaneLayout } from "./slidingdoors";
import Stool, { getStoolFootprint, StoolSpot } from "./stool";
import type { Rect } from "./stair";

// Homes three or more modules wide give their middle module (right of
// centre when there are four) to two bathrooms and a kitchen, on the
// ground floor; two-wide homes give their right module to a small bath, a
// closet and a galley kitchen. Units are feet, in the module's own
// coordinates: x across it, z along it from the back end wall (-z) to the
// front (+z)
export const hasServices = (cols: number) => cols >= 3;
export const hasGalley = (cols: number) => cols === 2;

export const getServicesModuleX = (cols: number) =>
  -4 * cols + 4 + 8 * Math.floor(cols / 2);

// 4.5" walls from the finished floor to the ceiling. The side walls stand
// inside the module over its posts, 1/4" proud of them on both faces, so the
// module arrives with its walls built and the neighbours' posts stay exposed
export const WALL = 4.5 / 12;
export const SIDE_OUTER = 4 - POST_INSET + 1 / 48;
const SIDE_INNER = SIDE_OUTER - WALL;
// The end wall lining's inner face
export const END_FACE = 19.475;
// The bathrooms take the back 17.6 ft, split between a tub bath at the end
// and a shower bath, and the kitchen starts at their front face. The side
// walls carry on past it, over the middle columns, to frame the pantry and
// fridge wall and finish flush with its doors, 2" in front of the columns
const PARTITION_Z = -10.5;
export const BLOCK_FRONT = -1.875;
export const WALL_END = BLOCK_FRONT + TALL_DEPTH;
// 6'-8" doorways, with the wall carried over them to the ceiling
export const DOOR_HEIGHT = 80 / 12;

export const ROOMS = {
  tubBath: {
    x: [-SIDE_INNER, SIDE_INNER],
    z: [-END_FACE, PARTITION_Z - WALL / 2],
  } as Rect,
  showerBath: {
    x: [-SIDE_INNER, SIDE_INNER],
    z: [PARTITION_Z + WALL / 2, BLOCK_FRONT - WALL],
  } as Rect,
  kitchen: { x: [-SIDE_INNER, SIDE_INNER], z: [BLOCK_FRONT, END_FACE] } as Rect,
};

// Where the walls on one side of the module stand, across x
const sideX = (side: number) =>
  [side * SIDE_INNER, side * SIDE_OUTER].sort((a, b) => a - b) as [
    number,
    number,
  ];

// One side wall, from the end wall to the front of the pantry and fridge,
// with a gap for each door and a header over it
const sideWall = (side: number, doors: Door[]): Part[] => {
  const x = sideX(side);
  const gaps = doors
    .filter((door) => door.side === side)
    .map((door) => door.z)
    .sort((a, b) => a[0] - b[0]);
  const parts: Part[] = [];
  let from = -END_FACE;
  gaps.forEach(([z0, z1]) => {
    parts.push(part("gyp", x, [FLOOR, CEILING], [from, z0]));
    parts.push(part("gyp", x, [FLOOR + DOOR_HEIGHT, CEILING], [z0, z1]));
    from = z1;
  });
  parts.push(part("gyp", x, [FLOOR, CEILING], [from, WALL_END]));
  return parts;
};

export const getServicesLayout = (cols: number) => {
  if (!hasServices(cols)) return null;
  const tubBath = getTubBath(ROOMS.tubBath);
  const showerBath = getShowerBath(ROOMS.showerBath);
  const doors = [tubBath.door, showerBath.door];
  const across: [number, number] = [-SIDE_INNER, SIDE_INNER];
  const walls = [
    ...sideWall(-1, doors),
    ...sideWall(1, doors),
    part(
      "gyp",
      across,
      [FLOOR, CEILING],
      [PARTITION_Z - WALL / 2, PARTITION_Z + WALL / 2],
    ),
    part("gyp", across, [FLOOR, CEILING], [BLOCK_FRONT - WALL, BLOCK_FRONT]),
    // short walls either side of the range run, in line with the side walls
    // and finishing flush with its counter
    ...[-1, 1].map((side) =>
      part(
        "gyp",
        sideX(side),
        [FLOOR, CEILING],
        [END_FACE - COUNTER_DEPTH, END_FACE],
      ),
    ),
  ];
  return {
    moduleX: getServicesModuleX(cols),
    doors,
    walls,
    fixtures: [
      ...tubBath.parts,
      ...showerBath.parts,
      ...getKitchenParts(ROOMS.kitchen),
    ],
    // the kitchen's floor is tiled like the bathrooms', wall to wall
    floors: tileFloor(ROOMS.kitchen),
    stools: getStools(ROOMS.kitchen),
  };
};

// The galley takes the back half of the module, from the middle column to
// the second joint in the glass doors, clear of a 2x2's stair in the front
// half of the other module. The closet and bath stand against the glass on
// the +x side, and the kitchen runs along their inside wall, its counter
// front on the line where the two modules meet. Cross walls are centred on
// the column and the joint, and the one on the column hides its posts
export const GALLEY_END = -getPaneJoints()[1];
export const CLOSET_LENGTH = 3.5;
export const GALLEY_FACE = -SIDE_OUTER + COUNTER_DEPTH;
const GALLEY_Z0 = GALLEY_END + WALL / 2;
const CLOSET_WALL = GALLEY_Z0 + CLOSET_LENGTH;

// The galley's tiled floor runs under its counter and on across the whole
// neighbouring module to its glass, between the cross walls' faces
export const GALLEY_FLOOR: Rect = {
  x: [-12, GALLEY_FACE],
  z: [GALLEY_Z0, -WALL / 2],
};

export const GALLEY_ROOMS = {
  closet: {
    x: [GALLEY_FACE + WALL, SIDE_INNER],
    z: [GALLEY_Z0, CLOSET_WALL],
  } as Rect,
  bath: {
    x: [GALLEY_FACE + WALL, SIDE_INNER],
    z: [CLOSET_WALL + WALL, -WALL / 2],
  } as Rect,
};

// A wall across the module, from the counter front to the glass, with a
// doorway by the glass and a header over it
const crossWall = (z: number, [d0, d1]: [number, number]): Part[] => {
  const across: [number, number] = [z - WALL / 2, z + WALL / 2];
  return [
    part("gyp", [-SIDE_OUTER, d0], [FLOOR, CEILING], across),
    part("gyp", [d0, d1], [FLOOR + DOOR_HEIGHT, CEILING], across),
    part("gyp", [d1, SIDE_INNER], [FLOOR, CEILING], across),
  ];
};

export const getGalleyLayout = (cols: number) => {
  if (!hasGalley(cols)) return null;
  const { closet, bath: room } = GALLEY_ROOMS;
  const bath = getGalleyBath(room);
  const closetDoor: [number, number] = [
    SIDE_INNER - DOOR_INSET - DOOR_WIDTH,
    SIDE_INNER - DOOR_INSET,
  ];
  // a shelf and hanging rail along the closet's kitchen wall
  const rail = GALLEY_FACE + WALL + 1;
  const walls = [
    part("gyp", sideX(1), [FLOOR, CEILING], [GALLEY_END - WALL / 2, WALL / 2]),
    part(
      "gyp",
      [GALLEY_FACE, GALLEY_FACE + WALL],
      [FLOOR, CEILING],
      [GALLEY_Z0, -WALL / 2],
    ),
    part("gyp", closet.x, [FLOOR, CEILING], [CLOSET_WALL, CLOSET_WALL + WALL]),
    ...crossWall(GALLEY_END, closetDoor),
    ...crossWall(0, bath.doorX),
  ];
  return {
    moduleX: getServicesModuleX(cols),
    doors: { closet: closetDoor, bath: bath.doorX },
    walls,
    fixtures: [
      ...bath.parts,
      part(
        "walnut",
        [closet.x[0], closet.x[0] + 1.3],
        [FLOOR + 5.55, FLOOR + 5.62],
        closet.z,
      ),
      part(
        "stainless",
        [rail - 0.03, rail + 0.03],
        [FLOOR + 5.3, FLOOR + 5.36],
        closet.z,
      ),
      ...getGalleyParts(GALLEY_FACE, [GALLEY_Z0, -WALL / 2]),
    ],
    floors: tileFloor(GALLEY_FLOOR),
    stools: [] as StoolSpot[],
  };
};

// The glass panes the galley's closet and bath are built against, on the
// home's +x side of the ground floor, which take siding instead
export const getSidedPanes = (cols: number, stories: number) =>
  hasGalley(cols)
    ? getPaneLayout(1, 4 * cols, stories)
        .filter(({ position: [, y, z], width }) => {
          const [z0, z1] = [z - width / 2, z + width / 2];
          return y < CEILING && z0 > GALLEY_END - 0.1 && z1 < 0.1;
        })
        .map(({ id }) => id)
    : [];

// What there is to walk around, in home coordinates
export const getServicesBlocks = (cols: number): Rect[] => {
  const layout = getServicesLayout(cols) ?? getGalleyLayout(cols);
  if (!layout) return [];
  return [
    ...getFootprints([...layout.walls, ...layout.fixtures], layout.moduleX),
    ...layout.stools.map((stool) =>
      getStoolFootprint({ ...stool, x: stool.x + layout.moduleX }),
    ),
  ];
};

interface ServicesProps {
  cols: number;
  tileColor?: string;
}

const Services = ({ cols, tileColor }: ServicesProps) => {
  const layout = getServicesLayout(cols) ?? getGalleyLayout(cols);
  if (!layout) return null;
  const colors = tileColor ? tileColors(tileColor) : undefined;

  return (
    <group position={[layout.moduleX, 0, 0]}>
      <Parts parts={layout.walls} />
      <Parts parts={layout.fixtures} colors={colors} />
      <Parts parts={layout.floors} colors={colors} />
      {layout.stools.map((stool) => (
        <Stool key={`${stool.x},${stool.z}`} {...stool} />
      ))}
    </group>
  );
};

export default Services;
