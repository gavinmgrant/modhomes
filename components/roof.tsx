import { useEffect, useMemo } from "react";
import { ExtrudeGeometry, Shape, Vector2 } from "three";
import { COLORS } from "./colors";

export type Point = [number, number, number];
export type ProfilePoint = [number, number];

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

// The flat underside of the hip, facing down, so the insulation reads as a
// solid when it's seen from below on its own, as it drops in the landing hero
export const getRoofUndersideTriangles = (
  width: number,
  depth: number,
): Point[][] => {
  const [halfW, halfD] = [width / 2, depth / 2];
  const corners: Point[] = [
    [-halfW, 0, -halfD],
    [halfW, 0, -halfD],
    [halfW, 0, halfD],
    [-halfW, 0, halfD],
  ];
  return [
    [corners[0], corners[1], corners[2]],
    [corners[0], corners[2], corners[3]],
  ];
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

// Type B (wide rib) metal roof deck, in feet: 1 1/2" deep ribs at 6" on
// centre, 3 1/2" top flanges, 1 3/4" bottom flanges and sloped webs between.
// The sheet is drawn 1/16" thick, a little heavier than real 20 gauge
export const DECK = {
  depth: 1.5 / 12,
  pitch: 6 / 12,
  topFlange: 3.5 / 12,
  bottomFlange: 1.75 / 12,
  gauge: 1 / 16 / 12,
};
const DECK_WEB = (DECK.pitch - DECK.topFlange - DECK.bottomFlange) / 2;

// The deck's top surface in section, as [along, up] points over a length
// centred on 0, its bottom flanges at 0. It starts and ends halfway across a
// top flange, so the ribs sit evenly about the middle
export const getDeckProfile = (length: number): ProfilePoint[] => {
  const ribs = Math.round(length / DECK.pitch);
  const start = -length / 2;
  const halfTop = DECK.topFlange / 2;
  const points: ProfilePoint[] = [[start, DECK.depth]];
  for (let i = 0; i < ribs; i++) {
    const at = start + i * DECK.pitch + halfTop;
    points.push(
      [at, DECK.depth],
      [at + DECK_WEB, 0],
      [at + DECK_WEB + DECK.bottomFlange, 0],
      [at + 2 * DECK_WEB + DECK.bottomFlange, DECK.depth],
    );
  }
  points.push([start + ribs * DECK.pitch, DECK.depth]);
  return points;
};

// A line's points moved `thickness` to its right (below a line running
// left to right), mitred at each bend so the sheet keeps its thickness on
// the webs as well as the flanges
export const offsetProfile = (
  points: ProfilePoint[],
  thickness: number,
): ProfilePoint[] => {
  const normals = points.slice(1).map(([x, y], i) => {
    const [dx, dy] = [x - points[i][0], y - points[i][1]];
    const length = Math.hypot(dx, dy);
    return [-dy / length, dx / length];
  });
  return points.map(([x, y], i) => {
    const a = normals[Math.max(i - 1, 0)];
    const b = normals[Math.min(i, normals.length - 1)];
    const scale = thickness / (1 + a[0] * b[0] + a[1] * b[1]);
    return [x - (a[0] + b[0]) * scale, y - (a[1] + b[1]) * scale];
  });
};

interface RoofDeckProps {
  position: [number, number, number];
  width: number;
  depth: number;
}

// The deck sheet, its ribs spanning the width between the frame's side beams
// and repeating along its depth, its bottom flanges at position
const RoofDeck = ({ position, width, depth }: RoofDeckProps) => {
  const geometry = useMemo(() => {
    const top = getDeckProfile(depth);
    const bottom = offsetProfile(top, DECK.gauge);
    const outline = [...top, ...bottom.reverse()].map(
      ([x, y]) => new Vector2(x, y + DECK.gauge),
    );
    const sheet = new ExtrudeGeometry(new Shape(outline), {
      depth: width,
      bevelEnabled: false,
    });
    // The section is drawn across z and extruded along x
    sheet.rotateY(Math.PI / 2);
    sheet.translate(-width / 2, 0, 0);
    return sheet;
  }, [width, depth]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh position={position} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={COLORS.deck}
        metalness={0.6}
        roughness={0.4}
      />
    </mesh>
  );
};

interface RoofProps {
  color: string;
  position: [number, number, number];
  width: number;
  // Where the hip's ridge tops out, in the same frame as position: level with
  // the tops of the parapets around it
  ridgeHeight: number;
  // Show the slab as Type B metal deck, with the sloped insulation laid
  // straight onto it, still peaking at the ridge
  deck?: boolean;
  // Which layers to draw: both, or just the slab (or deck) or the sloped
  // insulation, so the landing hero can drop them in one after the other
  layer?: RoofLayer;
}

export type RoofLayer = "all" | "deck" | "insulation";

// A flat roof slab with a low hip roof on top, its ridge hidden behind the
// parapets
const Roof = ({
  color,
  position,
  width,
  ridgeHeight,
  deck = false,
  layer = "all",
}: RoofProps) => {
  const slabBottom = position[1] - SLAB_THICKNESS / 2;
  const slabTop = deck
    ? slabBottom + DECK.depth
    : position[1] + SLAB_THICKNESS / 2;
  const { positions, normals } = useMemo(() => {
    const triangles = [
      ...getHipRoofTriangles(width, SLAB_DEPTH, ridgeHeight - slabTop),
      ...getRoofUndersideTriangles(width, SLAB_DEPTH),
    ];
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
      {layer !== "insulation" && deck && (
        <RoofDeck
          position={[position[0], slabBottom, position[2]]}
          width={width}
          depth={SLAB_DEPTH}
        />
      )}
      {layer !== "insulation" && !deck && (
        <mesh position={position} castShadow receiveShadow>
          <boxGeometry args={[width, SLAB_THICKNESS, SLAB_DEPTH]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      )}
      {layer !== "deck" && (
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
      )}
    </>
  );
};

export default Roof;
