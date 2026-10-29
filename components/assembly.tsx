import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { getEntranceProgress, prefersReducedMotion } from "./slidingdoors";

export type AssemblyStep = {
  delay: number;
  duration: number;
};

// The landing hero builds the home on its steel frame, in seconds from the
// first frame: the walls slide in one after another, then the floor, ceiling
// and roof drop in from the bottom of their stack up, then the sliding doors
// slide in
export const ASSEMBLY = {
  walls: { delay: 0.8, duration: 1, stagger: 0.3 },
  floor: { delay: 2.6, duration: 1.1 },
  ceiling: { delay: 3.4, duration: 0.9 },
  roof: { delay: 4.1, duration: 0.9 },
  windows: 5,
};

// Walls arrive in turn: front end, back end, then the left and right sides
// (their cladding, parapet and the dark header over the doors)
export const WALL_ORDER = { front: 0, back: 1, left: 2, right: 3 };

export const getWallStep = (order: number): AssemblyStep => ({
  delay: ASSEMBLY.walls.delay + order * ASSEMBLY.walls.stagger,
  duration: ASSEMBLY.walls.duration,
});

// Where each piece starts, as an offset in feet from where it ends up. The
// floor, ceiling and roof start stacked above the steel frame (its top beams
// reach 6.5 ft) at 8, 10 and 12 ft
export const WALL_OFFSET = 12;
// Inside the 10 ft the doors wait at, so the two never cross
export const SIDE_OFFSET = 6;
export const FLOOR_OFFSET = 12;
export const CEILING_OFFSET = 6.1;
export const ROOF_OFFSET = 6.75;

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
  // three has no type definitions installed here, so the ref is untyped
  const group = useRef<any>(null);
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
