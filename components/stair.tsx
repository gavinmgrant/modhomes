import React from "react";
import { COLORS } from "./colors";
import { POST_INSET, POST_SIZE } from "./module";

// Units are feet. Floor-to-floor is 10 ft: 16 risers of 7.5" and 15 treads
// with a 10" run, so the flight is 12.5 ft long
const LOWER_FLOOR = -3.95;
const RISERS = 16;
const RISE = 10 / RISERS;
const RUN = 10 / 12;
const TREADS = RISERS - 1;
// 3'-6" treads, in an opening 3" wider each side to fit the guards and lining
const WIDTH = 3.5;
const OPENING_MARGIN = 0.25;
const TREAD_THICKNESS = 0.25;
const NOSING = 0.08;
const STRINGER = { width: 0.5, depth: 0.75 };
// Cable railing either side: steel posts on the tread ends, a wood cap 36"
// above the nosing line, and cables about 3" apart running the whole flight
const RAIL = {
  height: 3,
  post: 2 / 12,
  postInset: 0.15,
  cap: { width: 3.5 / 12, depth: 1.5 / 12 },
  capOverhang: 0.25,
  // Real cables are 1/8"; drawn a little thicker so they read at a distance
  cable: 0.025,
  firstCable: 0.3,
  cableSpacing: 3 / 12,
};
export const RAIL_HEIGHT = RAIL.height;
const POSTS_PER_SIDE = 5;
// Inner face of the columns where the first module meets the next
export const COLUMN_FACE = 4 - POST_INSET - POST_SIZE;
// The flight climbs toward the middle of the home, starting 4.5 ft out from
// the end wall's inner face so there's room to walk around the bottom step.
// It still stops short of the middle column at z = 0
const END_WALL_FACE = 19.5;
export const BOTTOM_CLEARANCE = 4.5;
const TOP_Z = END_WALL_FACE - BOTTOM_CLEARANCE - TREADS * RUN;
// The opening between stories: from the ground floor ceiling's underside to
// the upper floor's surface, lined with 1" boards to hide the slab edges
const CEILING_UNDERSIDE = 3.85;
const UPPER_FLOOR = LOWER_FLOOR + 10;
export const LINING = 1 / 12;
// A 42" wall around the opening upstairs, open at the end the stair arrives
export const UPSTAIRS_WALL = { height: 3.5, thickness: 4 / 12 };

export type Rect = { x: [number, number]; z: [number, number] };

// The stair's opening sits in the first module, against the line where it
// joins the next one, with the treads centred in it; in home coordinates
export const getStairLayout = (cols: number) => {
  const moduleX = -4 * cols + 4;
  const z: [number, number] = [TOP_Z, TOP_Z + TREADS * RUN];
  const openingRight = moduleX + COLUMN_FACE;
  const opening: Rect = {
    x: [openingRight - WIDTH - 2 * OPENING_MARGIN, openingRight],
    z,
  };
  const footprint: Rect = {
    x: [opening.x[0] + OPENING_MARGIN, opening.x[1] - OPENING_MARGIN],
    z,
  };
  return { moduleX, footprint, opening };
};

export type Box = {
  position: [number, number, number];
  size: [number, number, number];
};

const boxBetween = (
  [x0, x1]: [number, number],
  [y0, y1]: [number, number],
  [z0, z1]: [number, number]
): Box => ({
  position: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  size: [x1 - x0, y1 - y0, z1 - z0],
});

// Boards lining all four faces of the opening, and the upstairs wall on the
// two long sides and the far end, flush with the lining's inner face
export const getOpeningParts = (opening: Rect) => {
  const [x0, x1] = opening.x;
  const [topZ, bottomZ] = opening.z;
  const between: [number, number] = [CEILING_UNDERSIDE, UPPER_FLOOR];
  const lining = [
    boxBetween([x0, x0 + LINING], between, [topZ, bottomZ]),
    boxBetween([x1 - LINING, x1], between, [topZ, bottomZ]),
    boxBetween([x0, x1], between, [topZ, topZ + LINING]),
    boxBetween([x0, x1], between, [bottomZ - LINING, bottomZ]),
  ];

  const { height, thickness } = UPSTAIRS_WALL;
  const upstairs: [number, number] = [UPPER_FLOOR, UPPER_FLOOR + height];
  const reach = thickness - LINING;
  const walls = [
    boxBetween([x0 + LINING - thickness, x0 + LINING], upstairs, [
      topZ,
      bottomZ + reach,
    ]),
    boxBetween([x1 - LINING, x1 - LINING + thickness], upstairs, [
      topZ,
      bottomZ + reach,
    ]),
    boxBetween([x0 - reach, x1 + reach], upstairs, [
      bottomZ - LINING,
      bottomZ + reach,
    ]),
  ];
  return { lining, walls };
};

// Top of each tread, from the bottom step up
export const getTreads = () =>
  Array.from({ length: TREADS }, (_, i) => ({
    y: LOWER_FLOOR + (i + 1) * RISE,
    z: TOP_Z + TREADS * RUN - (i + 0.5) * RUN,
  }));

const SLOPE = RISE / RUN;
const ANGLE = Math.atan(SLOPE);

// Height of the nosing line (the tread tops) at z
const nosingY = (z: number) => {
  const [bottom] = getTreads();
  return bottom.y + (bottom.z - z) * SLOPE;
};

// Treads carrying a railing post: the bottom and top steps, and evenly
// between, keeping each span under 4 ft
export const getRailPostTreads = () =>
  Array.from({ length: POSTS_PER_SIDE }, (_, i) =>
    Math.round((i * (TREADS - 1)) / (POSTS_PER_SIDE - 1))
  );

export type SlopedBox = Box & { rotation: [number, number, number] };

// A box running parallel to the stair from zFrom to zTo, `offset` above the
// nosing line
const alongStair = (
  x: number,
  zFrom: number,
  zTo: number,
  offset: number,
  width: number,
  height: number
): SlopedBox => {
  const z = (zFrom + zTo) / 2;
  return {
    position: [x, nosingY(z) + offset, z],
    size: [width, height, Math.abs(zTo - zFrom) / Math.cos(ANGLE)],
    rotation: [ANGLE, 0, 0],
  };
};

// One side's railing, with its posts centred on x
export const getRailing = (x: number) => {
  const treads = getTreads();
  const postTreads = getRailPostTreads().map((i) => treads[i]);
  const bottomZ = postTreads[0].z;
  const topZ = postTreads[postTreads.length - 1].z;
  const postHeight = RAIL.height - RAIL.cap.depth;

  const posts: Box[] = postTreads.map(({ y, z }) => ({
    position: [x, y + postHeight / 2, z],
    size: [RAIL.post, postHeight, RAIL.post],
  }));
  const cap = alongStair(
    x,
    bottomZ + RAIL.capOverhang,
    topZ - RAIL.capOverhang,
    RAIL.height - RAIL.cap.depth / 2,
    RAIL.cap.width,
    RAIL.cap.depth
  );
  const cables: SlopedBox[] = [];
  for (
    let offset = RAIL.firstCable;
    offset < postHeight - 0.1;
    offset += RAIL.cableSpacing
  ) {
    cables.push(alongStair(x, bottomZ, topZ, offset, RAIL.cable, RAIL.cable));
  }
  return { posts, cap, cables };
};

interface CableRailingProps {
  x: number;
}

const CableRailing = ({ x }: CableRailingProps) => {
  const { posts, cap, cables } = getRailing(x);

  return (
    <group>
      {posts.map(({ position, size }) => (
        <mesh key={position.join()} position={position} castShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color={COLORS.frame} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={cap.position} rotation={cap.rotation} castShadow>
        <boxGeometry args={cap.size} />
        <meshStandardMaterial color={COLORS.tread} roughness={0.6} />
      </mesh>
      {cables.map(({ position, size, rotation }) => (
        <mesh key={position.join()} position={position} rotation={rotation}>
          <boxGeometry args={size} />
          <meshStandardMaterial
            color={COLORS.cable}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

interface StairProps {
  cols: number;
}

// Open-riser stair: thick oak treads on a single steel stringer, with cable
// railings either side, rising through a lined opening with a wall around it
// upstairs
const Stair = ({ cols }: StairProps) => {
  const { footprint, opening } = getStairLayout(cols);
  const { lining, walls } = getOpeningParts(opening);
  const centerX = (footprint.x[0] + footprint.x[1]) / 2;
  const [topZ, bottomZ] = footprint.z;
  const length = Math.hypot(bottomZ - topZ, RISERS * RISE);
  const angle = Math.atan2(RISERS * RISE, bottomZ - topZ);

  return (
    <group>
      {getTreads().map(({ y, z }) => (
        <mesh
          key={y}
          position={[centerX, y - TREAD_THICKNESS / 2, z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[WIDTH, TREAD_THICKNESS, RUN + NOSING]} />
          <meshStandardMaterial color={COLORS.tread} roughness={0.6} />
        </mesh>
      ))}
      <mesh
        position={[
          centerX,
          LOWER_FLOOR + (RISERS * RISE) / 2 - STRINGER.depth,
          (topZ + bottomZ) / 2,
        ]}
        rotation={[angle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[STRINGER.width, STRINGER.depth, length]} />
        <meshStandardMaterial color={COLORS.frame} roughness={0.4} />
      </mesh>
      <CableRailing x={footprint.x[0] + RAIL.postInset} />
      <CableRailing x={footprint.x[1] - RAIL.postInset} />
      {[...lining, ...walls].map(({ position, size }) => (
        <mesh key={position.join()} position={position} receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial
            color={COLORS.gyp}
            metalness={0.1}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Stair;
