import { useMemo } from "react";

export type Point = [number, number, number];

const SLAB_THICKNESS = 0.75;
const SLAB_DEPTH = 39;

// A hip roof over a width (x) by depth (z) footprint centred on 0, as
// triangles wound counter-clockwise from outside, its eaves at y = 0. Every
// side slopes equally, so the ridge runs along the longer side and stops
// short of each end by half the shorter one; a square footprint peaks in a
// point
export const getHipRoofTriangles = (
  width: number,
  depth: number,
  rise: number,
): Point[][] => {
  const [halfW, halfD] = [width / 2, depth / 2];
  const half = Math.min(halfW, halfD);
  const [ridgeX, ridgeZ] = [halfW - half, halfD - half];
  // Each eave corner and the end of the ridge its hip climbs to, going round
  // so that each side's corners run left to right seen from outside
  const corners: Point[] = [
    [-halfW, 0, -halfD],
    [-halfW, 0, halfD],
    [halfW, 0, halfD],
    [halfW, 0, -halfD],
  ];
  const ridgeEnd = ([x, , z]: Point): Point => [
    Math.sign(x) * ridgeX,
    rise,
    Math.sign(z) * ridgeZ,
  ];

  return corners.flatMap((a, i) => {
    const b = corners[(i + 1) % corners.length];
    const [ridgeA, ridgeB] = [ridgeEnd(a), ridgeEnd(b)];
    // The long sides are trapezoids; the ends are triangles
    const sameEnd = ridgeA.every((value, axis) => value === ridgeB[axis]);
    return sameEnd
      ? [[a, b, ridgeB]]
      : [
          [a, b, ridgeB],
          [a, ridgeB, ridgeA],
        ];
  });
};

// The outward normal of a counter-clockwise triangle
export const getNormal = ([a, b, c]: Point[]): Point => {
  const u = b.map((value, axis) => value - a[axis]);
  const v = c.map((value, axis) => value - a[axis]);
  const n: Point = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const length = Math.hypot(...n);
  return n.map((value) => value / length) as Point;
};

interface RoofProps {
  color: string;
  position: number[];
  width: number;
  // Where the hip's ridge tops out, in the same frame as position: level with
  // the tops of the parapets around it
  ridgeHeight: number;
}

// A flat roof slab with a low hip roof on top, its ridge hidden behind the
// parapets
const Roof = ({ color, position, width, ridgeHeight }: RoofProps) => {
  const slabTop = position[1] + SLAB_THICKNESS / 2;
  const { positions, normals } = useMemo(() => {
    const triangles = getHipRoofTriangles(
      width,
      SLAB_DEPTH,
      ridgeHeight - slabTop,
    );
    return {
      positions: new Float32Array(triangles.flat(2)),
      normals: new Float32Array(
        triangles.flatMap((triangle) => {
          const normal = getNormal(triangle);
          return [...normal, ...normal, ...normal];
        }),
      ),
    };
  }, [width, ridgeHeight, slabTop]);

  return (
    <>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[width, SLAB_THICKNESS, SLAB_DEPTH]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh
        position={[position[0], slabTop, position[2]]}
        castShadow
        receiveShadow
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute attach="attributes-normal" args={[normals, 3]} />
        </bufferGeometry>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
    </>
  );
};

export default Roof;
