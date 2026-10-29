import React from "react";
import { COLORS } from "./colors";

// Units are feet. Floor-to-floor is 10 ft: 16 risers of 7.5" and 15 treads
// with a 10" run, so the flight is 12.5 ft long
const LOWER_FLOOR = -3.95;
const RISERS = 16;
const RISE = 10 / RISERS;
const RUN = 10 / 12;
const TREADS = RISERS - 1;
const WIDTH = 4.5;
const TREAD_THICKNESS = 0.25;
const NOSING = 0.08;
const STRINGER = { width: 0.5, depth: 0.75 };
const GUARD_HEIGHT = 3;
// Inner face of the columns where the first module meets the next
const COLUMN_FACE = 3.375;
// The flight climbs toward the middle of the home, starting 4.5 ft out from
// the end wall's inner face so there's room to walk around the bottom step.
// It still stops short of the middle column at z = 0
const END_WALL_FACE = 19.5;
export const BOTTOM_CLEARANCE = 4.5;
const TOP_Z = END_WALL_FACE - BOTTOM_CLEARANCE - TREADS * RUN;

export type Rect = { x: [number, number]; z: [number, number] };

// The stair sits in the first module, against the line where it joins the
// next one; returned in home coordinates
export const getStairLayout = (cols: number) => {
  const moduleX = -4 * cols + 4;
  const footprint: Rect = {
    x: [moduleX + COLUMN_FACE - WIDTH, moduleX + COLUMN_FACE],
    z: [TOP_Z, TOP_Z + TREADS * RUN],
  };
  return { moduleX, footprint };
};

// Top of each tread, from the bottom step up
export const getTreads = () =>
  Array.from({ length: TREADS }, (_, i) => ({
    y: LOWER_FLOOR + (i + 1) * RISE,
    z: TOP_Z + TREADS * RUN - (i + 0.5) * RUN,
  }));

interface GlassGuardProps {
  x: number;
  bottomZ: number;
  topZ: number;
}

// Frameless glass panel following the slope of the flight, with vertical ends
const GlassGuard = ({ x, bottomZ, topZ }: GlassGuardProps) => {
  const slope = RISE / RUN;
  const lowY = LOWER_FLOOR;
  const highY = LOWER_FLOOR + (bottomZ - topZ) * slope;
  // prettier-ignore
  const positions = new Float32Array([
    x, lowY, bottomZ,   x, highY, topZ,   x, highY + GUARD_HEIGHT, topZ,
    x, lowY, bottomZ,   x, highY + GUARD_HEIGHT, topZ,   x, lowY + GUARD_HEIGHT, bottomZ,
  ]);

  return (
    <mesh>
      <bufferGeometry onUpdate={(self: any) => self.computeVertexNormals()}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <meshStandardMaterial
        color={COLORS.glass}
        transparent
        opacity={0.22}
        metalness={0.2}
        roughness={0.05}
        depthWrite={false}
        // THREE.DoubleSide; three has no type definitions installed here
        side={2}
      />
    </mesh>
  );
};

interface StairProps {
  cols: number;
}

// Open-riser stair: thick oak treads on a single steel stringer, with glass
// guards either side
const Stair = ({ cols }: StairProps) => {
  const { footprint } = getStairLayout(cols);
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
      {footprint.x.map((x, side) => (
        <GlassGuard
          key={side}
          x={x + (side === 0 ? -0.05 : 0.05)}
          bottomZ={bottomZ}
          topZ={topZ}
        />
      ))}
    </group>
  );
};

export default Stair;
