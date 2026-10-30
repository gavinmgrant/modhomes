import React from "react";
import { POST_INSET } from "./module";
import { CEILING, FLOOR, getFootprints, part, Part, Parts } from "./fixtures";
import { Door, getShowerBath, getTubBath } from "./bathroom";
import { COUNTER_DEPTH, getKitchenParts, TALL_DEPTH } from "./kitchen";
import type { Rect } from "./stair";

// Homes three or more modules wide give their middle module (right of
// centre when there are four) to two bathrooms and a kitchen, on the
// ground floor. Units are feet, in the module's own coordinates: x across
// it, z along it from the back end wall (-z) to the front (+z)
export const hasServices = (cols: number) => cols >= 3;

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
  };
};

// What there is to walk around, in home coordinates
export const getServicesBlocks = (cols: number): Rect[] => {
  const layout = getServicesLayout(cols);
  if (!layout) return [];
  return getFootprints([...layout.walls, ...layout.fixtures], layout.moduleX);
};

interface ServicesProps {
  cols: number;
}

const Services = ({ cols }: ServicesProps) => {
  const layout = getServicesLayout(cols);
  if (!layout) return null;

  return (
    <group position={[layout.moduleX, 0, 0]}>
      <Parts parts={layout.walls} />
      <Parts parts={layout.fixtures} />
    </group>
  );
};

export default Services;
