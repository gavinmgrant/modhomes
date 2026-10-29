import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { COLORS } from "./colors";

export const PANES_PER_HALF = 3;
// The opening runs from the middle column (z = 0) to the end wall column faces
const OPENING_END = 19.25;
const FLOOR = -4;
const CEILING = 3.9;
const STORY_HEIGHT = 10;
// Two sliding tracks just outside the module edge, inside the end wall frame
const TRACKS = [0.15, 0.35];
// Neighbouring panes overlap like real sliding doors
const OVERLAP = 0.08;
const FRAME = 0.12;
// As deep as the track spacing, so frames on neighbouring tracks meet
const FRAME_DEPTH = TRACKS[1] - TRACKS[0];
const GLASS_DEPTH = 0.03;
// The end wall frame's outer face and the bottom of its top beam, measured
// from the module edge (see EndWall)
const END_WALL_FACE = 0.55;
const END_WALL_BEAM_BOTTOM = 4.5;
// Units are feet; keep the header 3 inches back from the end wall's face
export const HEADER_INSET = 0.25;
// Entrance: panes start 10 ft out from the wall and slide in one at a time
export const ENTER_DISTANCE = 10;
export const ENTER_STAGGER = 0.5;
export const ENTER_DURATION = 0.8;

export type PaneLayout = {
  id: string;
  position: [number, number, number];
  width: number;
  height: number;
};

// side: -1 for the left open side, 1 for the right; half: -1 back, 1 front
export const getPaneLayout = (
  side: number,
  halfWidth: number,
  stories: number,
): PaneLayout[] => {
  const width = (OPENING_END + (PANES_PER_HALF - 1) * OVERLAP) / PANES_PER_HALF;
  const height = CEILING - FLOOR;
  const panes: PaneLayout[] = [];

  for (let story = 0; story < stories; story++) {
    for (const half of [-1, 1]) {
      for (let index = 0; index < PANES_PER_HALF; index++) {
        panes.push({
          id: `${side < 0 ? "left" : "right"}-${story}-${
            half < 0 ? "back" : "front"
          }-${index}`,
          position: [
            side * (halfWidth + TRACKS[index % 2]),
            STORY_HEIGHT * story + (FLOOR + CEILING) / 2,
            half * (width / 2 + index * (width - OVERLAP)),
          ],
          width,
          height,
        });
      }
    }
  }
  return panes;
};

export type HeaderLayout = {
  position: [number, number, number];
  size: [number, number, number];
};

// Dark band filling the gap between the top story's doors and the end wall's
// top beam, set back from the end wall's outer face
export const getHeaderLayout = (
  side: number,
  halfWidth: number,
  stories: number,
): HeaderLayout => {
  const depth = END_WALL_FACE - HEADER_INSET;
  const storyOffset = STORY_HEIGHT * (stories - 1);
  const height = END_WALL_BEAM_BOTTOM - CEILING;
  return {
    position: [
      side * (halfWidth + depth / 2),
      storyOffset + (CEILING + END_WALL_BEAM_BOTTOM) / 2,
      0,
    ],
    size: [depth, height, 2 * OPENING_END],
  };
};

export type PaneEntrance = {
  from: number;
  delay: number;
};

// Eased 0-1 progress of a pane's slide in, `elapsed` seconds after mount
export const getEntranceProgress = (
  elapsed: number,
  delay: number,
  duration = ENTER_DURATION,
) => {
  const t = Math.min(Math.max((elapsed - delay) / duration, 0), 1);
  return 1 - Math.pow(1 - t, 3);
};

// Panes slide in from one end of the wall to the other, lowest story first,
// the first one `start` seconds after mount
export const getEntranceDelays = (panes: PaneLayout[], start = 0) => {
  const order = [...panes].sort(
    (a, b) => a.position[1] - b.position[1] || a.position[2] - b.position[2],
  );
  return new Map(
    order.map((pane, rank) => [pane.id, start + rank * ENTER_STAGGER]),
  );
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface GlassPaneProps {
  position: [number, number, number];
  width: number;
  height: number;
  entrance?: PaneEntrance;
}

// One sliding door: a glass sheet in a dark frame, kept as its own group so
// it can be animated on its own
export const GlassPane = ({
  position,
  width,
  height,
  entrance,
}: GlassPaneProps) => {
  // three has no type definitions installed here, so the ref is untyped
  const group = useRef<any>(null);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    if (!entrance || !group.current) return;
    // Time from the first frame these panes were drawn
    const startedAt = (start.current ??= state.clock.elapsedTime);
    const progress = getEntranceProgress(
      state.clock.elapsedTime - startedAt,
      entrance.delay,
    );
    group.current.position.x = position[0] + entrance.from * (1 - progress);
  });

  return (
    <group ref={group} position={position}>
      <mesh>
        <boxGeometry
          args={[GLASS_DEPTH, height - 2 * FRAME, width - 2 * FRAME]}
        />
        <meshStandardMaterial
          color={COLORS.glass}
          transparent
          opacity={0.22}
          metalness={0.2}
          roughness={0.05}
          depthWrite={false}
        />
      </mesh>
      {[1, -1].map((edge) => (
        <mesh
          key={`rail${edge}`}
          position={[0, (edge * (height - FRAME)) / 2, 0]}
        >
          <boxGeometry args={[FRAME_DEPTH, FRAME, width]} />
          <meshStandardMaterial color={COLORS.frame} roughness={0.4} />
        </mesh>
      ))}
      {[1, -1].map((edge) => (
        <mesh
          key={`stile${edge}`}
          position={[0, 0, (edge * (width - FRAME)) / 2]}
        >
          <boxGeometry args={[FRAME_DEPTH, height, FRAME]} />
          <meshStandardMaterial color={COLORS.frame} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
};

interface SlidingDoorsProps {
  side: number;
  halfWidth: number;
  stories: number;
  // Slide the panes in one after another when they mount
  animateIn?: boolean;
  // Seconds after mount before the first pane starts sliding in
  animateDelay?: number;
  // Leave the header out, for when it's drawn (and animated) separately
  hideHeader?: boolean;
}

interface DoorHeaderProps {
  side: number;
  halfWidth: number;
  stories: number;
}

// Dark band over the top story's doors, up to the end wall's top beam
export const DoorHeader = ({ side, halfWidth, stories }: DoorHeaderProps) => {
  const header = getHeaderLayout(side, halfWidth, stories);
  return (
    <mesh position={header.position}>
      <boxGeometry args={header.size} />
      <meshStandardMaterial color={COLORS.frame} roughness={0.4} />
    </mesh>
  );
};

// Floor-to-ceiling sliding glass doors filling one open side of a home,
// with a dark header above them
const SlidingDoors = ({
  side,
  halfWidth,
  stories,
  animateIn = false,
  animateDelay = 0,
  hideHeader = false,
}: SlidingDoorsProps) => {
  const panes = getPaneLayout(side, halfWidth, stories);
  const delays =
    animateIn && !prefersReducedMotion()
      ? getEntranceDelays(panes, animateDelay)
      : null;

  return (
    <>
      {panes.map(({ id, ...pane }) => (
        <GlassPane
          key={id}
          {...pane}
          entrance={
            delays
              ? { from: side * ENTER_DISTANCE, delay: delays.get(id) ?? 0 }
              : undefined
          }
        />
      ))}
      {!hideHeader && (
        <DoorHeader side={side} halfWidth={halfWidth} stories={stories} />
      )}
    </>
  );
};

export default SlidingDoors;
