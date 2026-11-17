import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import {
  END_WALL_BEAM_BOTTOM,
  ENTER_DISTANCE,
  FLOOR,
  getEntranceProgress,
} from "./slidingdoors";
import { prefersReducedMotion } from "../lib/media";
import { MODEL_BASE, getParapetTop } from "../lib/dimensions";

export type AssemblyStep = {
  delay: number;
  duration: number;
};

// The landing hero builds the home on its steel frame, in seconds from the
// first frame: the walls slide in one after another, then the floor,
// ceiling, metal roof deck and sloped roof insulation drop in from the bottom
// of their stack up, then the sliding doors slide in
export const ASSEMBLY = {
  walls: { delay: 0.8, duration: 1, stagger: 0.3 },
  floor: { delay: 2.6, duration: 1.1 },
  ceiling: { delay: 3.4, duration: 0.9 },
  deck: { delay: 4.1, duration: 0.9 },
  insulation: { delay: 4.8, duration: 0.9 },
  windows: 5.7,
};

// Walls arrive in turn: front end, back end, then the left and right sides
// (their cladding, parapet and the dark header over the doors)
export const WALL_ORDER = { front: 0, back: 1, left: 2, right: 3 };

export const getWallStep = (order: number): AssemblyStep => ({
  delay: ASSEMBLY.walls.delay + order * ASSEMBLY.walls.stagger,
  duration: ASSEMBLY.walls.duration,
});

// Where each piece starts, as an offset in feet from where it ends up. The
// floor, ceiling, roof deck and roof insulation start stacked 2 ft apart
// above the steel frame, at 8, 10, 12 and 14 ft (the deck's ribs and the
// insulation's eaves) in the module's own frame
export const WALL_OFFSET = 12;
// Inside the 10 ft the doors wait at, so the two never cross
export const SIDE_OFFSET = 6;
export const FLOOR_OFFSET = 12;
export const CEILING_OFFSET = 6.1;
// The deck's ribs land at 4.875 ft and the insulation's eaves on the deck,
// 1 1/2" higher
export const DECK_OFFSET = 12 - 4.875;
export const INSULATION_OFFSET = 14 - 5;

// The hero camera starts this far above the home's parapets, looking down at
// the home's centre, where it stays as the camera turns
export const CAMERA_RISE = 50;
export const CAMERA_HEIGHT = getParapetTop(1) + CAMERA_RISE;

type Span = [number, number];
type Extent = { x: Span; y: Span; z: Span };
const around = (half: number): Span => [-half, half];

// What has to stay in frame as the home turns, at the furthest each piece
// gets from the centre: the home itself, the floor, ceiling, deck and
// insulation stacked over it, its end walls and side walls where they start
// out, and the doors 10 ft out past its sides
const PARAPET_TOP = getParapetTop(1);
const SHELL = { halfWidth: 4.55, halfLength: 20.3 };
export const ASSEMBLY_EXTENTS: Extent[] = [
  {
    x: around(SHELL.halfWidth),
    y: [MODEL_BASE, PARAPET_TOP],
    z: around(SHELL.halfLength),
  },
  {
    x: around(3.5),
    y: [PARAPET_TOP, PARAPET_TOP + INSULATION_OFFSET],
    z: around(19.5),
  },
  {
    x: around(4),
    y: [MODEL_BASE, PARAPET_TOP],
    z: around(SHELL.halfLength + WALL_OFFSET),
  },
  {
    x: around(SHELL.halfWidth + SIDE_OFFSET),
    y: [MODEL_BASE, PARAPET_TOP],
    z: around(SHELL.halfLength),
  },
  {
    x: around(4 + ENTER_DISTANCE),
    y: [FLOOR, END_WALL_BEAM_BOTTOM],
    z: around(20),
  },
];
const CORNERS = ASSEMBLY_EXTENTS.flatMap(({ x, y, z }) =>
  x.flatMap((cx) => y.flatMap((cy) => z.map((cz) => [cx, cy, cz]))),
);
// The home's turns checked, every 4 degrees
const TURNS = Array.from({ length: 90 }, (_, i) => (i * Math.PI) / 45);
// Breathing room around the furthest pieces, as a share of the frame
const FRAME_MARGIN = 1.05;

// Whether every corner stays in the frame of a camera this far out across
// the ground and this high, looking at the centre, however the home turns
const fitsInFrame = (
  across: number,
  height: number,
  tanUp: number,
  tanAcross: number,
) => {
  const length = Math.hypot(across, height);
  // The camera looks along -z, down: forward, right and up in the frame
  const [fy, fz] = [-height / length, -across / length];
  const [uy, uz] = [across / length, -height / length];
  return TURNS.every((turn) => {
    const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
    return CORNERS.every(([x, y, z]) => {
      const [px, py, pz] = [x * cos - z * sin, y, x * sin + z * cos];
      const [vy, vz] = [py - height, pz - across];
      const depth = vy * fy + vz * fz;
      return (
        depth > 0 &&
        Math.abs(px) <= tanAcross * depth &&
        Math.abs(vy * uy + vz * uz) <= tanUp * depth
      );
    });
  });
};

// Where the hero camera sits, CAMERA_HEIGHT above the centre and as near
// across the ground as keeps every piece in frame as the home turns,
// whatever shape the canvas is
export const getAssemblyCamera = (aspect: number, fov: number) => {
  const tanUp = Math.tan((fov * Math.PI) / 360) / FRAME_MARGIN;
  const tanAcross = tanUp * aspect;
  let [near, far] = [0, 1000];
  while (far - near > 0.01) {
    const mid = (near + far) / 2;
    if (fitsInFrame(mid, CAMERA_HEIGHT, tanUp, tanAcross)) far = mid;
    else near = mid;
  }
  return { across: far, height: CAMERA_HEIGHT };
};

interface AssembleInProps {
  from: [number, number, number];
  // Without a step the children are simply drawn in place
  step?: AssemblyStep;
  // Called once the children have landed
  onDone?: () => void;
  children: React.ReactNode;
}

// Moves its children into place from `from`. The group itself sits at the final position, so anything measuring
// the scene on mount (like Stage's centring) sees the finished home
const AssembleIn = ({ from, step, onDone, children }: AssembleInProps) => {
  const group = useRef<Group>(null);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  useFrame((state) => {
    if (!step || done.current || !group.current) return;
    const startedAt = (start.current ??= state.clock.elapsedTime);
    const progress = prefersReducedMotion()
      ? 1
      : getEntranceProgress(
          state.clock.elapsedTime - startedAt,
          step.delay,
          step.duration,
        );
    group.current.position.set(
      from[0] * (1 - progress),
      from[1] * (1 - progress),
      from[2] * (1 - progress),
    );
    if (progress === 1) {
      done.current = true;
      onDone?.();
    }
  });

  return <group ref={group}>{children}</group>;
};

export default AssembleIn;
