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
// Each pane's width, so the panes in each half span the opening
const PANE_WIDTH =
  (OPENING_END + (PANES_PER_HALF - 1) * OVERLAP) / PANES_PER_HALF;
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
  const width = PANE_WIDTH;
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

// Where neighbouring panes overlap, out along z from the middle column in
// either half: the vertical lines across the glass that inside walls line up
// with
export const getPaneJoints = () =>
  Array.from(
    { length: PANES_PER_HALF - 1 },
    (_, i) => (i + 1) * (PANE_WIDTH - OVERLAP) + OVERLAP / 2,
  );

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

// Dark bands across the floor line between each pair of stories, filling the
// gap between one story's doors and the next, in line with the header
export const getFloorBandLayouts = (
  side: number,
  halfWidth: number,
  stories: number,
): HeaderLayout[] => {
  const depth = END_WALL_FACE - HEADER_INSET;
  const height = STORY_HEIGHT + FLOOR - CEILING;
  return Array.from({ length: stories - 1 }, (_, story) => ({
    position: [
      side * (halfWidth + depth / 2),
      STORY_HEIGHT * story + CEILING + height / 2,
      0,
    ],
    size: [depth, height, 2 * OPENING_END],
  }));
};

// A 1" tall, 2" deep groove along the middle of each floor band
// A dark sill along the foot of each story's doors, over the edge beam they
// stand on, from the floor's edge out to the beam's outer face and flush
// with the finished floor
const FINISHED_FLOOR = -3.95;

export const getSillLayouts = (
  side: number,
  halfWidth: number,
  stories: number,
): HeaderLayout[] =>
  Array.from({ length: stories }, (_, story) => ({
    position: [
      side * (halfWidth + END_WALL_FACE / 2),
      STORY_HEIGHT * story + (FLOOR + FINISHED_FLOOR) / 2,
      0,
    ],
    size: [END_WALL_FACE, FINISHED_FLOOR - FLOOR, 2 * OPENING_END],
  }));

export const REVEAL = { height: 1 / 12, depth: 2 / 12 };

// Faces of a box, in the order three.js draws their materials
const FACES = { top: 2, bottom: 3 };

export type TrimPiece = HeaderLayout & {
  // Faces drawn in shadow, inside the reveal
  shaded?: number[];
};

// Splits a floor band into full-depth strips above and below the reveal, and
// the strip set back behind it
export const getRevealPieces = (
  band: HeaderLayout,
  side: number,
): TrimPiece[] => {
  const [x, y, z] = band.position;
  const [depth, height, length] = band.size;
  const strip = (height - REVEAL.height) / 2;
  const offset = (strip + REVEAL.height) / 2;
  return [
    {
      position: [x, y + offset, z],
      size: [depth, strip, length],
      shaded: [FACES.bottom],
    },
    {
      position: [x, y - offset, z],
      size: [depth, strip, length],
      shaded: [FACES.top],
    },
    {
      position: [x - (side * REVEAL.depth) / 2, y, z],
      size: [depth - REVEAL.depth, REVEAL.height, length],
      shaded: [0, 1, 2, 3, 4, 5],
    },
  ];
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

// Where a room is built against the glass, its pane is filled with
// horizontal cedar boards instead: 6" each from the bottom rail up, the top
// one cut to fit, with a 1/4" shadow joint between them
export const SIDING = { board: 0.5, joint: 1 / 48, depth: 0.06 };

export const getSidingBoards = (height: number) => {
  const [bottom, top] = [-height / 2 + FRAME, height / 2 - FRAME];
  const boards: [number, number][] = [];
  for (let y = bottom; y < top - 1e-9; y += SIDING.board) {
    boards.push([y, Math.min(y + SIDING.board - SIDING.joint, top)]);
  }
  return boards;
};

interface GlassPaneProps {
  position: [number, number, number];
  width: number;
  height: number;
  entrance?: PaneEntrance;
  infill?: "glass" | "siding";
  sidingColor?: string;
  trimColor?: string;
}

// One sliding door: a glass sheet, or siding, in a metal frame, kept as its
// own group so it can be animated on its own
export const GlassPane = ({
  position,
  width,
  height,
  entrance,
  infill = "glass",
  sidingColor = COLORS.siding,
  trimColor = COLORS.trim,
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
      {infill === "glass" ? (
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
      ) : (
        <>
          {/* dark behind the boards, so the joints read as shadow lines */}
          <mesh>
            <boxGeometry
              args={[GLASS_DEPTH, height - 2 * FRAME, width - 2 * FRAME]}
            />
            <meshStandardMaterial color={COLORS.reveal} roughness={0.9} />
          </mesh>
          {getSidingBoards(height).map(([y0, y1]) => (
            <mesh key={y0} position={[0, (y0 + y1) / 2, 0]}>
              <boxGeometry args={[SIDING.depth, y1 - y0, width - 2 * FRAME]} />
              <meshStandardMaterial color={sidingColor} roughness={0.8} />
            </mesh>
          ))}
        </>
      )}
      {[1, -1].map((edge) => (
        <mesh
          key={`rail${edge}`}
          position={[0, (edge * (height - FRAME)) / 2, 0]}
        >
          <boxGeometry args={[FRAME_DEPTH, FRAME, width]} />
          <meshStandardMaterial color={trimColor} roughness={0.4} />
        </mesh>
      ))}
      {[1, -1].map((edge) => (
        <mesh
          key={`stile${edge}`}
          position={[0, 0, (edge * (width - FRAME)) / 2]}
        >
          <boxGeometry args={[FRAME_DEPTH, height, FRAME]} />
          <meshStandardMaterial color={trimColor} roughness={0.4} />
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
  // Panes filled with siding instead of glass, by id, and its colour
  sided?: string[];
  sidingColor?: string;
  // The color of the door frames and the trim around them
  trimColor?: string;
}

interface DoorHeaderProps {
  side: number;
  halfWidth: number;
  stories: number;
  trimColor?: string;
}

const Trim = ({
  position,
  size,
  shaded,
  color = COLORS.trim,
}: TrimPiece & { color?: string }) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    {shaded ? (
      Array.from({ length: 6 }, (_, face) => (
        <meshStandardMaterial
          key={face}
          attach={`material-${face}`}
          color={shaded.includes(face) ? COLORS.reveal : color}
          roughness={0.4}
        />
      ))
    ) : (
      <meshStandardMaterial color={color} roughness={0.4} />
    )}
  </mesh>
);

// Dark band over the top story's doors, up to the end wall's top beam
export const DoorHeader = ({
  side,
  halfWidth,
  stories,
  trimColor,
}: DoorHeaderProps) => (
  <Trim {...getHeaderLayout(side, halfWidth, stories)} color={trimColor} />
);

// Floor-to-ceiling sliding glass doors filling one open side of a home,
// with a dark header above them and a dark band at each floor line between
const SlidingDoors = ({
  side,
  halfWidth,
  stories,
  animateIn = false,
  animateDelay = 0,
  hideHeader = false,
  sided = [],
  sidingColor,
  trimColor,
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
          infill={sided.includes(id) ? "siding" : "glass"}
          sidingColor={sidingColor}
          trimColor={trimColor}
          entrance={
            delays
              ? { from: side * ENTER_DISTANCE, delay: delays.get(id) ?? 0 }
              : undefined
          }
        />
      ))}
      {getFloorBandLayouts(side, halfWidth, stories)
        .flatMap((band) => getRevealPieces(band, side))
        .map((piece) => (
          <Trim key={piece.position.join()} {...piece} color={trimColor} />
        ))}
      {getSillLayouts(side, halfWidth, stories).map((sill) => (
        <Trim key={sill.position.join()} {...sill} color={trimColor} />
      ))}
      {!hideHeader && (
        <DoorHeader
          side={side}
          halfWidth={halfWidth}
          stories={stories}
          trimColor={trimColor}
        />
      )}
    </>
  );
};

export default SlidingDoors;
