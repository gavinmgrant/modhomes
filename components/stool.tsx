import React, { useMemo } from "react";
import { FINISHES, FLOOR } from "./fixtures";
import type { Rect } from "./stair";

// A mid-century counter stool: a molded walnut plywood shell, its seat
// rolling over at the front and sweeping up into the back, on four splayed
// black steel rods with a square footring. Units are inches while it's laid
// out, in the stool's own coordinates: x across, y up from the floor, z
// toward the front of the seat, centred on the base
export const SEAT_HEIGHT = 26;

type Point = [number, number, number];

// The shell's centre line from the front lip (v = 0) to the top of the
// back (v = 1): z, y above the seat height, its half width, and how far its
// edges curl up toward the sitter
const PROFILE: [number, number, number, number][] = [
  [9.6, -1.6, 8.2, 0.3],
  [8.2, 0, 9, 0.8],
  [2, -0.8, 9.3, 1.4],
  [-4.5, -0.1, 9, 1.6],
  [-8, 2.8, 8.3, 2.2],
  [-9.8, 8, 7.5, 2.6],
  [-11.4, 14, 6.6, 2.4],
];

// Uniform Catmull-Rom through the profile's rows, v from 0 to 1
const profileAt = (v: number) => {
  const last = PROFILE.length - 1;
  const s = Math.min(Math.max(v, 0), 1) * last;
  const i = Math.min(Math.floor(s), last - 1);
  const t = s - i;
  const row = (j: number) => PROFILE[Math.min(Math.max(j, 0), last)];
  const [p0, p1, p2, p3] = [row(i - 1), row(i), row(i + 1), row(i + 2)];
  return p1.map(
    (_, k) =>
      0.5 *
      (2 * p1[k] +
        (p2[k] - p0[k]) * t +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t +
        (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t),
  );
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

// A point on the shell, u from -1 (left) to 1 (right) across it
export const getShellPoint = (u: number, v: number): Point => {
  const [z, y, half, curl] = profileAt(v);
  const e = 1e-3;
  const [za, ya] = profileAt(v - e);
  const [zb, yb] = profileAt(v + e);
  const length = Math.hypot(zb - za, yb - ya);
  // along the centre line toward the back, and square to it toward the sitter
  const [ty, tz] = [(yb - ya) / length, (zb - za) / length];
  const [ny, nz] = [-tz, ty];
  const u2 = u * u;
  const lift = curl * u2 * u2;
  // round the corners off the front lip and the top of the back
  const pull =
    1.5 * u2 * u2 * (1 - smoothstep(0, 0.2, v)) -
    3 * u2 * u2 * smoothstep(0.8, 1, v);
  return [
    u * half,
    SEAT_HEIGHT + y + ny * lift + ty * pull,
    z + nz * lift + tz * pull,
  ];
};

// The rods of the base, from the floor glides up to the shell's mounts
const ROD = 0.2;
const GLIDE = { radius: 0.45, height: 0.4 };
const FOOT = { x: 8.6, z: 8.2 };
// Rubber mounts under the seat, stopping just short of it so their flat
// tops don't show through where the seat dishes
const MOUNT = { x: 3.6, z: 3.4, height: 0.6, radius: 0.5, gap: 0.15 };
const FOOTRING = 9;

export type Rod = { from: Point; to: Point; radius: number };

// The shell's underside straight above a point on the seat
const shellUnder = (x: number, z: number) => {
  let best = { gap: Infinity, y: 0 };
  for (let i = 0; i <= 400; i++) {
    const v = (i / 400) * 0.6;
    const [, y, pz] = getShellPoint(x / profileAt(v)[2], v);
    if (Math.abs(pz - z) < best.gap) best = { gap: Math.abs(pz - z), y };
  }
  return best.y;
};

export const getStoolBase = () => {
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const mounts = corners.map(([sx, sz]): Point => {
    const [x, z] = [sx * MOUNT.x, sz * MOUNT.z];
    return [x, shellUnder(x, z) - MOUNT.gap - MOUNT.height, z];
  });
  const feet = corners.map(
    ([sx, sz]): Point => [sx * FOOT.x, GLIDE.height, sz * FOOT.z],
  );
  const at = (i: number, y: number): Point => {
    const t = (y - feet[i][1]) / (mounts[i][1] - feet[i][1]);
    return [0, 1, 2].map(
      (k) => feet[i][k] + (mounts[i][k] - feet[i][k]) * t,
    ) as Point;
  };
  const ring = (points: Point[]): Rod[] =>
    points.map((from, i) => ({
      from,
      to: points[(i + 1) % points.length],
      radius: ROD,
    }));
  return {
    legs: feet.map((from, i) => ({ from, to: mounts[i], radius: ROD })),
    footring: ring(corners.map((_, i) => at(i, FOOTRING))),
    bracket: ring(mounts),
    mounts,
    feet,
  };
};

// What it takes up on the floor: the shell's outline, which reaches past
// the base
export const getStoolFootprint = ({ x, z, facing }: StoolSpot): Rect => {
  const half = Math.max(...PROFILE.map(([, , w]) => w)) / 12;
  const [back, front] = [PROFILE[PROFILE.length - 1][0], PROFILE[0][0]].map(
    (d) => (facing * d) / 12,
  );
  return {
    x: [x - half, x + half],
    z: [z + Math.min(back, front), z + Math.max(back, front)],
  };
};

// Meshes are built in feet from plain arrays: positions, normals and the
// triangles' corner indices
type Mesh = { positions: number[]; normals: number[]; indices: number[] };

const sub = (a: Point, b: Point): Point => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const cross = (a: Point, b: Point): Point => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (a: Point): Point => {
  const length = Math.hypot(...a) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};
const toFeet = (p: Point): Point => [p[0] / 12, p[1] / 12, p[2] / 12];

const U_STEPS = 24;
const V_STEPS = 60;

// The shell as one curved sheet, drawn on both sides, with each vertex's
// normal averaged from the triangles around it
export const getShellMesh = (): Mesh => {
  const points: Point[] = [];
  for (let j = 0; j <= V_STEPS; j++) {
    for (let i = 0; i <= U_STEPS; i++) {
      points.push(toFeet(getShellPoint((2 * i) / U_STEPS - 1, j / V_STEPS)));
    }
  }
  const row = U_STEPS + 1;
  const indices: number[] = [];
  for (let j = 0; j < V_STEPS; j++) {
    for (let i = 0; i < U_STEPS; i++) {
      const a = j * row + i;
      indices.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const sums = points.map((): Point => [0, 0, 0]);
  for (let k = 0; k < indices.length; k += 3) {
    const [a, b, c] = [indices[k], indices[k + 1], indices[k + 2]];
    const face = cross(sub(points[b], points[a]), sub(points[c], points[a]));
    [a, b, c].forEach((n) => {
      sums[n] = [
        sums[n][0] + face[0],
        sums[n][1] + face[1],
        sums[n][2] + face[2],
      ];
    });
  }
  return {
    positions: points.flat(),
    normals: sums.map(normalize).flat(),
    indices,
  };
};

// A rounded plywood edge around the shell's rim: a thin tube along the loop
// of its four edges, each ring of the tube carried along from the last so
// it doesn't twist
const RIM = { radius: 0.22, sides: 6 };

export const getRimMesh = (): Mesh => {
  const loop: Point[] = [];
  const add = (u: number, v: number) => loop.push(toFeet(getShellPoint(u, v)));
  for (let j = 0; j < V_STEPS; j++) add(-1, j / V_STEPS);
  for (let i = 0; i < U_STEPS; i++) add((2 * i) / U_STEPS - 1, 1);
  for (let j = V_STEPS; j > 0; j--) add(1, j / V_STEPS);
  for (let i = U_STEPS; i > 0; i--) add((2 * i) / U_STEPS - 1, 0);
  const n = loop.length;
  const tangents = loop.map((_, k) =>
    normalize(sub(loop[(k + 1) % n], loop[(k + n - 1) % n])),
  );
  let normal = normalize(cross(tangents[0], [0, 1, 0]));
  const positions: number[] = [];
  const normals: number[] = [];
  loop.forEach((p, k) => {
    const t = tangents[k];
    normal = normalize(sub(normal, t.map((c) => c * dot(normal, t)) as Point));
    const binormal = cross(t, normal);
    for (let s = 0; s < RIM.sides; s++) {
      const angle = (2 * Math.PI * s) / RIM.sides;
      const out = normal.map(
        (c, i) => c * Math.cos(angle) + binormal[i] * Math.sin(angle),
      ) as Point;
      positions.push(...out.map((c, i) => p[i] + (c * RIM.radius) / 12));
      normals.push(...out);
    }
  });
  const indices: number[] = [];
  for (let k = 0; k < n; k++) {
    for (let s = 0; s < RIM.sides; s++) {
      const a = k * RIM.sides + s;
      const b = k * RIM.sides + ((s + 1) % RIM.sides);
      const [c, d] = [a, b].map((i) => (i + RIM.sides) % (n * RIM.sides));
      indices.push(a, c, b, b, c, d);
    }
  }
  return { positions, normals, indices };
};

// Where a rod's cylinder goes, in feet: its middle, its length, and the
// rotation turning an upright cylinder to lie along it
export const getRodTransform = ({ from, to }: Rod) => {
  const [a, b] = [toFeet(from), toFeet(to)];
  const along = sub(b, a);
  const length = Math.hypot(...along);
  const [dx, dy, dz] = normalize(along);
  // about the axis square to both straight up and the rod
  const axis = normalize([dz, 0, -dx]);
  const half = Math.acos(Math.min(Math.max(dy, -1), 1)) / 2;
  const quaternion: [number, number, number, number] =
    Math.hypot(dx, dz) < 1e-9
      ? [0, 0, 0, 1]
      : [
          axis[0] * Math.sin(half),
          axis[1] * Math.sin(half),
          axis[2] * Math.sin(half),
          Math.cos(half),
        ];
  return {
    position: [
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      (a[2] + b[2]) / 2,
    ] as Point,
    length,
    quaternion,
  };
};

const MeshGeometry = ({ positions, normals, indices }: Mesh) => (
  <bufferGeometry>
    <bufferAttribute
      attach="attributes-position"
      args={[new Float32Array(positions), 3]}
    />
    <bufferAttribute
      attach="attributes-normal"
      args={[new Float32Array(normals), 3]}
    />
    <bufferAttribute attach="index" args={[new Uint32Array(indices), 1]} />
  </bufferGeometry>
);

const RodMesh = (rod: Rod) => {
  const { position, length, quaternion } = getRodTransform(rod);
  const radius = rod.radius / 12;
  return (
    <mesh position={position} quaternion={quaternion} receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 12]} />
      <meshStandardMaterial {...FINISHES.blackSteel} />
    </mesh>
  );
};

// Where a stool's base stands, in its parent's x and z; `facing` is 1 when
// the seat faces +z
export type StoolSpot = { x: number; z: number; facing: 1 | -1 };

const Stool = ({ x, z, facing }: StoolSpot) => {
  const shell = useMemo(getShellMesh, []);
  const rim = useMemo(getRimMesh, []);
  const base = useMemo(getStoolBase, []);
  return (
    <group position={[x, FLOOR, z]} rotation={[0, facing > 0 ? 0 : Math.PI, 0]}>
      <mesh receiveShadow>
        <MeshGeometry {...shell} />
        {/* drawn on both sides, and taking little light from the landscape's
            bright sky, which would wash the walnut out where the seat faces
            up into it */}
        <meshStandardMaterial
          {...FINISHES.walnut}
          side={2}
          envMapIntensity={0.15}
        />
      </mesh>
      <mesh receiveShadow>
        <MeshGeometry {...rim} />
        <meshStandardMaterial {...FINISHES.plywood} />
      </mesh>
      {[...base.legs, ...base.footring, ...base.bracket].map((rod) => (
        <RodMesh key={`${rod.from.join()}-${rod.to.join()}`} {...rod} />
      ))}
      {base.mounts.map(([mx, my, mz]) => (
        <mesh
          key={`mount-${mx}-${mz}`}
          position={[mx / 12, (my + MOUNT.height / 2) / 12, mz / 12]}
        >
          <cylinderGeometry
            args={[MOUNT.radius / 12, MOUNT.radius / 12, MOUNT.height / 12, 12]}
          />
          <meshStandardMaterial {...FINISHES.blackSteel} />
        </mesh>
      ))}
      {base.feet.map(([fx, , fz]) => (
        <mesh
          key={`glide-${fx}-${fz}`}
          position={[fx / 12, GLIDE.height / 24, fz / 12]}
        >
          <cylinderGeometry
            args={[GLIDE.radius / 12, GLIDE.radius / 12, GLIDE.height / 12, 12]}
          />
          <meshStandardMaterial {...FINISHES.blackSteel} />
        </mesh>
      ))}
    </group>
  );
};

export default Stool;
