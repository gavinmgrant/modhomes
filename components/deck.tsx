import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group } from "three";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { COLORS } from "./colors";
import { FLOOR } from "./fixtures";
import { FOUNDATION } from "./foundation";
import { POST_SIZE } from "./module";
import {
  END_WALL_BEAM_BOTTOM,
  FLOOR as DOOR_FLOOR,
  END_WALL_FACE,
  getPaneJoints,
} from "./slidingdoors";
import { getHipRoofTriangles, getNormal, Point } from "./roof";
import { WALL_PANEL_DEPTH } from "./wall";
import DockToggle from "./docktoggle";
import {
  getParapetTop,
  MODEL_BASE,
  MODULE,
  STORY_HEIGHT,
} from "../lib/dimensions";
import { prefersReducedMotion } from "../lib/media";

// A covered deck is a module of its own, craned onto one of the home's long
// glass sides: an 8 ft deep steel frame as long as the home, with a wood
// floor flush with the ground floor inside and a slatted wood soffit under
// its roof. It stands on a concrete stem wall like the home's. Units are feet
export const DECK = { depth: 8, length: 40 };
// 5 1/2" boards with 1/4" gaps, running along the home
const BOARD = { width: 5.5 / 12, gap: 0.25 / 12, thickness: 1 / 12 };
// 3" square soffit slats, 2" apart, running out from the home
const SLAT = { width: 3 / 12, gap: 2 / 12, depth: 3 / 12 };
// The boards face the open sky, which lights them far more than the upright
// siding of the same color, so they came out much lighter. They take a tenth
// of its light, and render within a few levels of the siding in each wood
const BOARD_LIGHTING = { envMapIntensity: 0.1 };
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
// Where the foundation meets the ground
const GROUND = MODEL_BASE;

// A deck doesn't line up with the home: it slides one glass pane along it,
// mullion to mullion, so its middle post stands in front of the first
// mullion out from the middle. The decks on the two sides slide opposite
// ways, the right one toward +z and the left toward -z
export const DECK_SLIDE = getPaneJoints()[0];
// Where a deck runs on past the home's end, a stair runs down from its inner
// edge to the ground, along the home's end wall. It's as wide as the stretch
// past the wall: four 7 1/2" risers, and three treads of two deck boards
// each, an 11 1/4" run, between steel channel stringers
export const DECK_STAIR = { risers: 4 };
// The outer face of the home's end wall, along z from the middle
export const HOME_END = MODULE.length / 2 + WALL_PANEL_DEPTH / 2;
const STAIR_RUN = 2 * BOARD.width + BOARD.gap;
const STRINGER = {
  thickness: 2.5 / 12,
  // Measured square to the slope
  depth: 10 / 12,
  // The top edge runs this far above the treads' nosings
  above: 2 / 12,
  // The toe's upright end, cut back off the long point the slope meets the
  // ground in
  toe: 4 / 12,
};

// The top of the fascia and the roof's ridge. On a one-story home it's level
// with the parapet. A two-story home's deck stays one story tall,
// level with the top of the band under the upper story's glass
export const getDeckTop = (stories: number) =>
  stories > 1 ? STORY_HEIGHT + DOOR_FLOOR : getParapetTop(1);

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
  // The stair's wood treads, and its steel stringers as triangles
  treads: DeckBox[];
  stringers: Point[][];
};

// A convex prism as triangles wound counter-clockwise from outside: a
// polygon in the (a, y) plane, run across c from c0 to c1, and moved into
// place by `toWorld`
const getPrismTriangles = (
  profile: [number, number][],
  [u0, u1]: number[],
  toWorld: (c: number, y: number, a: number) => Point,
): Point[][] => {
  const corner = (c: number, k: number) =>
    toWorld(c, profile[k % profile.length][1], profile[k % profile.length][0]);
  const faces: Point[][] = [
    // The two caps, as fans
    ...[u0, u1].flatMap((u) =>
      profile
        .slice(1, -1)
        .map((_, k) => [corner(u, 0), corner(u, k + 1), corner(u, k + 2)]),
    ),
    // A quad along each edge of the polygon
    ...profile.flatMap((_, k) => [
      [corner(u0, k), corner(u0, k + 1), corner(u1, k + 1)],
      [corner(u0, k), corner(u1, k + 1), corner(u1, k)],
    ]),
  ];
  const centroid = (points: Point[]) =>
    [0, 1, 2].map(
      (axis) => points.reduce((sum, p) => sum + p[axis], 0) / points.length,
    );
  const middle = centroid(faces.flat());
  // Turned round where they'd face in
  return faces.map((triangle) => {
    const normal = getNormal(triangle);
    const out = centroid(triangle).map((value, axis) => value - middle[axis]);
    const facing = normal.reduce((sum, n, axis) => sum + n * out[axis], 0);
    return facing < 0 ? [...triangle].reverse() : triangle;
  });
};

// The deck's parts, in home coordinates. It stands against the glass side's
// frame, from its outer face out, slid along it by DECK_SLIDE
export const getDeckLayout = (
  side: DeckSide,
  halfWidth: number,
  stories = 1,
): DeckLayout => {
  const top = getDeckTop(stories);
  const inner = halfWidth + END_WALL_FACE;
  const [depth, half, post] = [DECK.depth, DECK.length / 2, POST_SIZE];
  const slide = side * DECK_SLIDE;
  // A box from u0 to u1 out from the deck's inner edge, and from z0 to z1
  // along it before it's slid
  const box = (
    [u0, u1]: number[],
    [y0, y1]: number[],
    [z0, z1]: number[],
  ): DeckBox => ({
    position: [
      side * (inner + (u0 + u1) / 2),
      (y0 + y1) / 2,
      (z0 + z1) / 2 + slide,
    ],
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
  // the inner middle one in front of a mullion. They stand on the
  // floor frame, from the top of the boards over it, so their faces don't
  // lie in the same planes as the boards' edges
  const posts = [0, depth - post].flatMap((u) =>
    [-half, -post / 2, half - post].map((z) =>
      box([u, u + post], [FLOOR, FASCIA_BOTTOM], [z, z + post]),
    ),
  );
  // From c0 to c1 along the home from its middle, toward the end the deck
  // slides to, as a z range for `box`
  const along = (c0: number, c1: number) =>
    (side > 0 ? [c0, c1] : [-c1, -c0]).map((z) => z - slide);
  const end = half + DECK_SLIDE;

  // The frame cantilevers past its stem walls, by as much as the home's
  // does past its own. Along the home there's no wall on its side: the end
  // wall there runs in under the glass side's frame to meet the home's stem
  // wall. Past the home's end the deck's inner edge cantilevers too, clear
  // of the stair, and the home's end stem wall runs on out to meet it
  const inset = FOUNDATION.inset;
  const { height, wall } = FOUNDATION;
  const stem = [GROUND, GROUND + height];
  const [homeEdge, outer] = [-(END_WALL_FACE + inset), depth - inset];
  const [first, last, homeEnd] = [
    -half + DECK_SLIDE + inset,
    end - inset,
    MODULE.length / 2 - inset,
  ];
  const foundation = [
    box([outer - wall, outer], stem, along(first, last)),
    box([homeEdge, outer - wall], stem, along(first, first + wall)),
    box([inset, outer - wall], stem, along(last - wall, last)),
    box([inset, inset + wall], stem, along(homeEnd, last - wall)),
    box([homeEdge, inset + wall], stem, along(homeEnd - wall, homeEnd)),
  ];

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
  const firstSlat = -(count * pitch - SLAT.gap) / 2;
  const slats = Array.from({ length: count }, (_, i) =>
    box(
      [post, depth - post],
      [soffit - SLAT.depth, soffit],
      [firstSlat + i * pitch, firstSlat + i * pitch + SLAT.width],
    ),
  );

  // The stair runs down from the deck's inner edge, past the home's end, in
  // along the end wall. `a` is how far in from that edge, and its stringers
  // stand against the wall and flush with the deck's end
  const { risers } = DECK_STAIR;
  const rise = (FLOOR - GROUND) / risers;
  const slope = rise / STAIR_RUN;
  const [s0, s1] = [HOME_END + STRINGER.thickness, end - STRINGER.thickness];
  // Each tread's two boards, from the top one down, running across the stair
  // with a gap between them like the deck's
  const treads = Array.from({ length: risers - 1 }, (_, i) => {
    const y = FLOOR - (i + 1) * rise;
    const a = i * STAIR_RUN;
    return [
      [a, a + BOARD.width],
      [a + BOARD.width + BOARD.gap, a + STAIR_RUN],
    ].map(([a0, a1]) =>
      box([-a1, -a0], [y - BOARD.thickness, y], along(s0, s1)),
    );
  }).flat();
  // A steel channel either side of the treads, its top edge running parallel
  // to the nosings, which meet the deck's boards at its edge. It's cut
  // upright against the deck's edge, and level with the deck's floor at the
  // top. At the bottom it bears level on the ground, its toe chamfered off
  // with an upright end
  const stringerTop = FLOOR + STRINGER.above;
  const stringerBottom =
    stringerTop - STRINGER.depth * Math.sqrt(1 + slope * slope);
  // How far in the top edge is at a height
  const topAt = (y: number) => (stringerTop - y) / slope;
  const toe = topAt(GROUND + STRINGER.toe);
  const profile: [number, number][] = [
    [0, FLOOR],
    [topAt(FLOOR), FLOOR],
    [toe, GROUND + STRINGER.toe],
    [toe, GROUND],
    [(stringerBottom - GROUND) / slope, GROUND],
    [0, stringerBottom],
  ];
  const toWorld = (c: number, y: number, a: number): Point => [
    side * (inner - a),
    y,
    side * c,
  ];
  const stringers = [
    [HOME_END, s0],
    [s1, end],
  ].flatMap((cs) => getPrismTriangles(profile, cs, toWorld));

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
          z + slide,
        ]),
    ),
    boards,
    slats,
    treads,
    stringers,
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

// How much the decks widen the home's footprint, counting one from the
// moment it's added, as each stands its full depth off a long side
export const getDecksWidth = (decks: Decks) =>
  ([-1, 1] as DeckSide[]).filter((side) => isDeckUp(decks[side])).length *
  DECK.depth;

// How much the decks lengthen it, as each runs on past one end of the home
// by its slide, to the nearest foot. The stairs aren't counted
export const getDecksLength = (decks: Decks) =>
  Math.round(
    ([-1, 1] as DeckSide[]).filter((side) => isDeckUp(decks[side])).length *
      DECK_SLIDE,
  );

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
  const group = useRef<Group>(null);
  const stem = useRef<Group>(null);
  const offset = useRef(phase === "dropping" ? DECK_DROP.height : 0);
  const from = useRef(offset.current);
  const start = useRef<number | null>(null);
  const settled = useRef(phase === "landed");
  const { foundation, frame, stringers, roof, hip, boards, slats } =
    useMemo(() => {
      const { roof, boards, treads, ...layout } = getDeckLayout(
        side,
        halfWidth,
        stories,
      );
      // The stair's treads are deck boards too
      return { ...layout, roof: [roof], boards: [...boards, ...treads] };
    }, [side, halfWidth, stories]);
  // The stem walls grow up out of the ground from their base, and are
  // hidden while they're below it
  const rise = getFoundationRise(offset.current);

  // Each phase picks up from wherever the last one left the deck. The
  // canvas only draws when asked, so a deck asks for frames while it moves
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    from.current = offset.current;
    start.current = null;
    settled.current = phase === "landed";
    invalidate();
  }, [phase, invalidate]);

  useFrame((state) => {
    if (settled.current || !group.current) return;
    state.invalidate();
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
        <Boxes boxes={frame} triangles={stringers}>
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </Boxes>
        <Boxes boxes={roof} triangles={hip}>
          <meshStandardMaterial
            color={COLORS.roof}
            metalness={0.5}
            roughness={0.5}
          />
        </Boxes>
        <Boxes boxes={boards}>
          <meshStandardMaterial
            color={woodColor}
            roughness={0.8}
            {...BOARD_LIGHTING}
          />
        </Boxes>
        <Boxes boxes={slats}>
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
  const side = useSyncExternalStore(facing.subscribe, facing.get, facing.get);
  const on = isDeckUp(decks[side]);
  const Icon = on ? IconMinus : IconPlus;

  return (
    <DockToggle
      caption="Deck"
      label="Deck on this side"
      title={on ? "Remove this deck" : "Add a deck on this side"}
      on={on}
      onClick={() => onToggle(side)}
      icon={<Icon size={18} aria-hidden />}
    />
  );
};
