import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useFrame } from "@react-three/fiber";
import { ButtonBase, Tooltip, useMediaQuery } from "@mui/material";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { COLORS } from "./colors";
import { FLOOR } from "./fixtures";
import { FOUNDATION, getStemWalls } from "./foundation";
import { POST_SIZE } from "./module";
import {
  END_WALL_BEAM_BOTTOM,
  FLOOR as DOOR_FLOOR,
  STORY_HEIGHT,
  END_WALL_FACE,
  prefersReducedMotion,
} from "./slidingdoors";
import { FOCUS_RING, INK, PAPER } from "./panel";
import { getSwatchSize } from "./swatch";
import { getHipRoofTriangles, getNormal, Point } from "./roof";

// A covered deck is a module of its own, craned onto one of the home's long
// glass sides: an 8 ft deep steel frame as long as the home, with a wood
// floor flush with the ground floor inside and a slatted wood soffit under
// its roof. It stands on a concrete stem wall like the home's. Units are feet
export const DECK = { depth: 8, length: 40 };
// 5 1/2" boards with 1/4" gaps, running along the home
const BOARD = { width: 5.5 / 12, gap: 0.25 / 12, thickness: 1 / 12 };
// 3" square soffit slats, 2" apart, running out from the home
const SLAT = { width: 3 / 12, gap: 2 / 12, depth: 3 / 12 };
// A 1 ft deep frame under the boards, like a module's floor frame
const RIM_HEIGHT = 1;
// The fascia's underside lines up with the underside of the home's top beam
// over its glass
const FASCIA_BOTTOM = END_WALL_BEAM_BOTTOM;
const ROOF_THICKNESS = 0.25;
// The roof is a low hip like the home's, rising as far from its eaves to its
// ridge as the home's does from its slab to the parapet top: 6.5 - 5.675. Its
// ridge is level with the top of the fascia, which hides it
export const HIP_RISE = 0.825;
// Where the foundation meets the ground (MODEL_BASE)
const GROUND = -6.45;

// The top of the fascia and the roof's ridge. On a one-story home it's level with the
// parapet, getParapetTop(1). A two-story home's deck stays one story tall,
// level with the top of the band under the upper story's glass
export const getDeckTop = (stories: number) =>
  stories > 1 ? STORY_HEIGHT + DOOR_FLOOR : 6.5;

// -1 for the home's left glass side, 1 for its right
export type DeckSide = -1 | 1;
// A deck drops in when it's added, then lifts away again when it's removed
export type DeckPhase = "dropping" | "landed" | "lifting";
export type Decks = Partial<Record<DeckSide, DeckPhase>>;

export type DeckBox = {
  position: [number, number, number];
  size: [number, number, number];
};

export type DeckLayout = {
  foundation: DeckBox[];
  frame: DeckBox[];
  roof: DeckBox;
  hip: Point[][];
  boards: DeckBox[];
  slats: DeckBox[];
};

// The deck's parts, in home coordinates. It stands against the glass side's
// frame, from its outer face out
export const getDeckLayout = (
  side: DeckSide,
  halfWidth: number,
  stories = 1,
): DeckLayout => {
  const top = getDeckTop(stories);
  const inner = halfWidth + END_WALL_FACE;
  const [depth, half, post] = [DECK.depth, DECK.length / 2, POST_SIZE];
  // A box from u0 to u1 out from the deck's inner edge
  const box = (
    [u0, u1]: number[],
    [y0, y1]: number[],
    [z0, z1]: number[],
  ): DeckBox => ({
    position: [side * (inner + (u0 + u1) / 2), (y0 + y1) / 2, (z0 + z1) / 2],
    size: [u1 - u0, y1 - y0, z1 - z0],
  });

  // A beam round each edge of a level, the end ones between the long ones
  const ring = (ys: number[]) => [
    box([0, post], ys, [-half, half]),
    box([depth - post, depth], ys, [-half, half]),
    box([post, depth - post], ys, [-half, -half + post]),
    box([post, depth - post], ys, [half - post, half]),
  ];
  const rim = [FLOOR - BOARD.thickness - RIM_HEIGHT, FLOOR - BOARD.thickness];
  const fascia = [FASCIA_BOTTOM, top];
  // Posts at the corners and the middle of both long sides, like a module's,
  // the inner ones in front of the home's own columns. They stand on the
  // floor frame, from the top of the boards over it, so their faces don't
  // lie in the same planes as the boards' edges
  const posts = [0, depth - post].flatMap((u) =>
    [-half, -post / 2, half - post].map((z) =>
      box([u, u + post], [FLOOR, FASCIA_BOTTOM], [z, z + post]),
    ),
  );
  // The frame cantilevers past its stem walls at the outer edge and ends by
  // as much as the home's does past its own. There's no wall on the home's
  // side: the end walls run in under the glass side's frame to meet the
  // home's stem wall
  const inset = FOUNDATION.inset;
  const footprint = box(
    [-(END_WALL_FACE + inset), depth - inset],
    [GROUND, GROUND + FOUNDATION.height],
    [-half + inset, half - inset],
  );
  const foundation = getStemWalls(
    footprint.size[0],
    footprint.size[2],
    -side as DeckSide,
  ).map(({ position, size }) => ({
    position: position.map(
      (value, axis) => value + footprint.position[axis],
    ) as DeckBox["position"],
    size,
  }));

  // Boards from the home out, the last one cut to fit
  const boards: DeckBox[] = [];
  for (let u = 0; u < depth - 1e-9; u += BOARD.width + BOARD.gap) {
    boards.push(
      box(
        [u, Math.min(u + BOARD.width, depth)],
        [FLOOR - BOARD.thickness, FLOOR],
        [-half, half],
      ),
    );
  }

  // As many whole slats as fit between the end beams, centred
  const eaves = top - HIP_RISE;
  const soffit = eaves - ROOF_THICKNESS;
  const pitch = SLAT.width + SLAT.gap;
  const count = Math.floor((2 * (half - post) + SLAT.gap) / pitch);
  const first = -(count * pitch - SLAT.gap) / 2;
  const slats = Array.from({ length: count }, (_, i) =>
    box(
      [post, depth - post],
      [soffit - SLAT.depth, soffit],
      [first + i * pitch, first + i * pitch + SLAT.width],
    ),
  );

  return {
    foundation,
    frame: [...ring(rim), ...ring(fascia), ...posts],
    // A slab inside the fascia ring, set back from the steel's outer faces,
    // so none of its faces lie in the same plane as the steel's, with the
    // hip on top of it
    roof: box(
      [post, depth - post],
      [soffit, eaves],
      [-half + post, half - post],
    ),
    hip: getHipRoofTriangles(depth - 2 * post, 2 * (half - post), HIP_RISE).map(
      (triangle) =>
        triangle.map(([x, y, z]): Point => [
          x + side * (inner + depth / 2),
          y + eaves,
          z,
        ]),
    ),
    boards,
    slats,
  };
};

// The crane lowers a deck from this far above its place, and hoists it back
// up there when it's removed
export const DECK_DROP = { height: 60, duration: 1.8 };

// How far above its place a deck is, `elapsed` seconds into a phase that
// started with it `from` ft up. It's lowered fast and set down gently, and
// hoisted slowly at first. Turning back partway covers just the distance
// left, at the same pace
export const getDeckOffset = (
  phase: DeckPhase,
  from: number,
  elapsed: number,
) => {
  if (phase === "landed") return 0;
  const target = phase === "lifting" ? DECK_DROP.height : 0;
  const duration =
    (DECK_DROP.duration * Math.abs(target - from)) / DECK_DROP.height;
  const t = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
  if (t === 1) return target;
  const eased = phase === "dropping" ? 1 - Math.pow(1 - t, 3) : t * t * t;
  return from + (target - from) * eased;
};

// How far up out of the ground a deck's stem wall has risen, 0 to 1. It
// rises to meet the deck as the crane lowers it, and sinks back as it's
// hoisted away
export const getFoundationRise = (offset: number) =>
  Math.min(Math.max(1 - offset / DECK_DROP.height, 0), 1);

// Whether a side has a deck, or one on its way down
export const isDeckUp = (phase?: DeckPhase) =>
  phase === "dropping" || phase === "landed";

// Whether any deck is on its way down or up
export const isDeckMoving = (decks: Decks) =>
  Object.values(decks).some((phase) => phase !== "landed");

// Adds a deck to a side, or takes away the one there
export const toggleDeck = (decks: Decks, side: DeckSide): Decks => ({
  ...decks,
  [side]: isDeckUp(decks[side]) ? "lifting" : "dropping",
});

// Once a deck has landed, or been lifted away
export const settleDeck = (decks: Decks, side: DeckSide): Decks => {
  const phase = decks[side];
  if (phase === "dropping") return { ...decks, [side]: "landed" };
  if (phase !== "lifting") return decks;
  const rest = { ...decks };
  delete rest[side];
  return rest;
};

// Finishes every move at once, for a view that draws the decks in place
export const landDecks = (decks: Decks): Decks =>
  ([-1, 1] as DeckSide[]).reduce(
    (landed, side) =>
      isDeckUp(decks[side]) ? { ...landed, [side]: "landed" } : landed,
    {} as Decks,
  );

// The glass side the camera is on. The outside view orbits the home's
// centre, on x = 0
export const getFacingSide = (cameraX: number): DeckSide =>
  cameraX < 0 ? -1 : 1;

export type FacingStore = ReturnType<typeof createFacingStore>;

// Which side faces the camera, kept outside React state, so orbiting only
// re-renders the dock's deck button and not the whole scene
export const createFacingStore = (initial: DeckSide = 1) => {
  let side = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => side,
    set: (next: DeckSide) => {
      if (next === side) return;
      side = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

// Follows the outside view's camera round the home
export const FacingSide = ({ store }: { store: FacingStore }) => {
  useFrame(({ camera }) => store.set(getFacingSide(camera.position.x)));
  return null;
};

// Every face of a set of boxes as triangles, wound counter-clockwise from
// outside, with each corner's normal, so a deck's parts in one material can
// be drawn as one mesh
export const getBoxesGeometry = (boxes: DeckBox[]) => {
  const positions: number[] = [];
  const normals: number[] = [];
  boxes.forEach(({ position, size }) => {
    for (let axis = 0; axis < 3; axis++) {
      // The face's other two axes, in the order that makes its corners run
      // counter-clockwise seen from the + side
      const [b, c] = [(axis + 1) % 3, (axis + 2) % 3];
      for (const sign of [1, -1]) {
        const corner = (u: number, v: number) => {
          const point = [...position];
          point[axis] += (sign * size[axis]) / 2;
          point[b] += (u * size[b]) / 2;
          point[c] += (v * size[c]) / 2;
          return point;
        };
        const quad = [
          corner(-1, -1),
          corner(1, -1),
          corner(1, 1),
          corner(-1, 1),
        ];
        if (sign < 0) quad.reverse();
        const normal = [0, 0, 0];
        normal[axis] = sign;
        [0, 1, 2, 0, 2, 3].forEach((i) => {
          positions.push(...quad[i]);
          normals.push(...normal);
        });
      }
    }
  });
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
  };
};

// Triangles wound counter-clockwise from outside, with each corner's
// normal, added on to a set of boxes' geometry
export const getTrianglesGeometry = (
  triangles: Point[][],
  boxes: DeckBox[] = [],
) => {
  const base = getBoxesGeometry(boxes);
  return {
    positions: Float32Array.from([
      ...Array.from(base.positions),
      ...triangles.flat(2),
    ]),
    normals: Float32Array.from([
      ...Array.from(base.normals),
      ...triangles.flatMap((triangle) => {
        const normal = getNormal(triangle);
        return [...normal, ...normal, ...normal];
      }),
    ]),
  };
};

// Boxes, and any other triangles, drawn as one mesh in the material given
// as children
const Boxes = ({
  boxes,
  triangles,
  children,
}: {
  boxes: DeckBox[];
  triangles?: Point[][];
  children: React.ReactNode;
}) => {
  const { positions, normals } = useMemo(
    () =>
      triangles
        ? getTrianglesGeometry(triangles, boxes)
        : getBoxesGeometry(boxes),
    [boxes, triangles],
  );
  return (
    <mesh castShadow receiveShadow>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-normal" args={[normals, 3]} />
      </bufferGeometry>
      {children}
    </mesh>
  );
};

interface DeckProps {
  side: DeckSide;
  halfWidth: number;
  stories?: number;
  // The frame matches the home's metal siding, and the boards and soffit its wood
  color: string;
  woodColor?: string;
  phase?: DeckPhase;
  // Called once a drop has landed or a lift has finished
  onSettled?: () => void;
}

const Deck = ({
  side,
  halfWidth,
  stories = 1,
  color,
  woodColor = COLORS.siding,
  phase = "landed",
  onSettled,
}: DeckProps) => {
  // three has no type definitions installed here, so the ref is untyped
  const group = useRef<any>(null);
  const stem = useRef<any>(null);
  const offset = useRef(phase === "dropping" ? DECK_DROP.height : 0);
  const from = useRef(offset.current);
  const start = useRef<number | null>(null);
  const settled = useRef(phase === "landed");
  const { foundation, frame, roof, hip, wood } = useMemo(() => {
    const { boards, slats, roof, ...layout } = getDeckLayout(
      side,
      halfWidth,
      stories,
    );
    return { ...layout, roof: [roof], wood: [...boards, ...slats] };
  }, [side, halfWidth, stories]);
  // The stem walls grow up out of the ground from their base, and are
  // hidden while they're below it
  const rise = getFoundationRise(offset.current);

  // Each phase picks up from wherever the last one left the deck
  useLayoutEffect(() => {
    from.current = offset.current;
    start.current = null;
    settled.current = phase === "landed";
  }, [phase]);

  useFrame((state) => {
    if (settled.current || !group.current) return;
    const startedAt = (start.current ??= state.clock.elapsedTime);
    const target = phase === "lifting" ? DECK_DROP.height : 0;
    offset.current = prefersReducedMotion()
      ? target
      : getDeckOffset(phase, from.current, state.clock.elapsedTime - startedAt);
    group.current.position.y = offset.current;
    if (stem.current) {
      const rise = getFoundationRise(offset.current);
      stem.current.scale.y = Math.max(rise, 1e-3);
      stem.current.visible = rise > 0;
    }
    if (offset.current === target) {
      settled.current = true;
      onSettled?.();
    }
  });

  return (
    <>
      <group
        ref={stem}
        position={[0, GROUND, 0]}
        scale={[1, Math.max(rise, 1e-3), 1]}
        visible={rise > 0}
      >
        <group position={[0, -GROUND, 0]}>
          <Boxes boxes={foundation}>
            <meshStandardMaterial color={COLORS.foundation} />
          </Boxes>
        </group>
      </group>
      <group ref={group} position={[0, offset.current, 0]}>
        <Boxes boxes={frame}>
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </Boxes>
        <Boxes boxes={roof} triangles={hip}>
          <meshStandardMaterial
            color={COLORS.roof}
            metalness={0.5}
            roughness={0.5}
          />
        </Boxes>
        <Boxes boxes={wood}>
          <meshStandardMaterial color={woodColor} roughness={0.8} />
        </Boxes>
      </group>
    </>
  );
};

export default Deck;

interface DeckToggleProps {
  decks: Decks;
  facing: FacingStore;
  onToggle: (side: DeckSide) => void;
}

// The dock's button for a deck on the glass side facing the camera,
// captioned like its swatches: it adds one there, or removes the one there
export const DeckToggle = ({ decks, facing, onToggle }: DeckToggleProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const { target, dot: circle } = getSwatchSize(isMobile);
  const side = useSyncExternalStore(facing.subscribe, facing.get, facing.get);
  const on = isDeckUp(decks[side]);
  const name = on ? "Remove this deck" : "Add a deck on this side";
  const Icon = on ? IconMinus : IconPlus;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column-reverse",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span
        aria-hidden
        style={{ fontSize: 11, lineHeight: 1.2, opacity: 0.6, marginTop: -6 }}
      >
        Deck
      </span>
      <Tooltip title={name}>
        <ButtonBase
          aria-label="Deck on this side"
          aria-pressed={on}
          onClick={() => onToggle(side)}
          sx={{
            width: target,
            height: target,
            flexShrink: 0,
            borderRadius: "50%",
            ...FOCUS_RING,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: circle,
              height: circle,
              borderRadius: "50%",
              background: on ? INK : "transparent",
              color: on ? PAPER : INK,
              boxShadow: "inset 0 0 0 1px rgba(19, 20, 20, 0.25)",
              transition: "background 150ms ease-out, color 150ms ease-out",
            }}
          >
            <Icon size={18} aria-hidden />
          </span>
        </ButtonBase>
      </Tooltip>
    </div>
  );
};
