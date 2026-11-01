import React, { useLayoutEffect, useRef } from "react";
import { COLORS } from "./colors";
import { useVeneer, VENEER_SIZE } from "./materials";
import { boxBetween, Box, Rect } from "./stair";

// Units are feet. The ground floor's finished surface and the underside of
// its ceiling
export const FLOOR = -3.95;
export const CEILING = 3.85;

// The scene lights the floor from above far more strongly than it does the
// walls, and its sky reflects in a shiny floor, so floor tile is drawn this
// much darker, in linear light, and reflects less, to read as the same tile
// as the walls
const FLOOR_SHADE = 0.4;

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

export const shadeColor = (hex: string, k: number) =>
  "#" +
  [1, 3, 5]
    .map((i) => {
      const c = toSrgb(toLinear(parseInt(hex.slice(i, i + 2), 16) / 255) * k);
      return Math.round(c * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("");

// The wall tile's chosen colour, and the floor tile's to go with it
export const tileColors = (color: string) => ({
  tile: color,
  floorTile: shadeColor(color, FLOOR_SHADE),
});

// Plain colors for now, standing in for real finishes. Walnut boxes are
// drawn in veneer instead (see Parts); its plain color is for the stools
export const FINISHES = {
  gyp: { color: COLORS.gyp, metalness: 0.1, roughness: 0.1 },
  walnut: { color: COLORS.walnut, roughness: 0.6 },
  quartz: { color: COLORS.quartz, roughness: 0.2 },
  porcelain: { color: COLORS.porcelain, roughness: 0.15 },
  stainless: { color: COLORS.stainless, metalness: 0.8, roughness: 0.3 },
  tile: { color: COLORS.tile, roughness: 0.3 },
  floorTile: {
    color: tileColors(COLORS.tile).floorTile,
    roughness: 0.3,
    envMapIntensity: 0.3,
  },
  glass: {
    color: COLORS.glass,
    roughness: 0.05,
    transparent: true,
    opacity: 0.22,
  },
  mirror: { color: COLORS.mirror, metalness: 0.8, roughness: 0.15 },
  // The range's glass top faces the sky, and reflecting it fully reads blue
  // rather than black
  cooktop: { color: COLORS.cooktop, roughness: 0.2, envMapIntensity: 0.25 },
  grout: { color: COLORS.grout, roughness: 0.8 },
  plywood: { color: COLORS.plywood, roughness: 0.6 },
  blackSteel: { color: COLORS.blackSteel, metalness: 0.6, roughness: 0.4 },
  // Seen only in the gaps between cabinet fronts
  reveal: { color: COLORS.reveal, roughness: 0.9 },
};

export type Finish = keyof typeof FINISHES;

// A box, or with `round` an upright cylinder (elliptical if its footprint
// isn't square), in the services module's coordinates
export type Part = Box & { finish: Finish; round?: boolean };

type Span = [number, number];

export const part = (
  finish: Finish,
  x: Span,
  y: Span,
  z: Span,
  round = false,
): Part => ({ ...boxBetween(x, y, z), finish, ...(round && { round }) });

// Fixtures are laid out against a wall: u runs along the wall, centred on
// the fixture, and d runs out from the wall's face into the room
export type LocalPart = {
  finish: Finish;
  u: Span;
  y: Span;
  d: Span;
  round?: boolean;
};

export const local = (
  finish: Finish,
  u: Span,
  y: Span,
  d: Span,
  round = false,
): LocalPart => ({ finish, u, y, d, round });

// Which way a fixture faces, out from the wall it stands against
export type Facing = "+x" | "-x" | "+z" | "-z";

// Places fixture parts with their wall's face centred on `at`, along x and z
export const place = (
  parts: LocalPart[],
  [x, z]: [number, number],
  facing: Facing,
): Part[] =>
  parts.map(({ finish, u: [u0, u1], y, d: [d0, d1], round }) => {
    switch (facing) {
      case "+z":
        return part(finish, [x + u0, x + u1], y, [z + d0, z + d1], round);
      case "-z":
        return part(finish, [x - u1, x - u0], y, [z - d1, z - d0], round);
      case "+x":
        return part(finish, [x + d0, x + d1], y, [z - u1, z - u0], round);
      case "-x":
        return part(finish, [x - d1, x - d0], y, [z + u0, z + u1], round);
    }
  });

// Places a single point given in a wall's u, y and d, as `place` does parts
export const placePoint = (
  [u, y, d]: [number, number, number],
  at: [number, number],
  facing: Facing,
) => place([local("reveal", [u, u], [y, y], [d, d])], at, facing)[0].position;

// Cabinet doors and drawer fronts: `count` panels across u, standing 3/4"
// proud of the carcass at d with 1/4" gaps, dark behind so they read, each
// with a small stainless pull along its top or bottom edge
const FRONT = { depth: 0.06, gap: 1 / 48 };
const PULL = {
  width: 0.25,
  height: 0.04,
  depth: 0.05,
  inset: 0.08,
  // from a door's opening edge to its pull's near end
  side: 0.1,
};

type Edge = "top" | "bottom";

const backing = (u: Span, y: Span, d: number) =>
  local("reveal", u, y, [d, d + FRONT.depth / 2]);

// The panels alone, each with its pull centred along u where `pullAt` puts it
const panels = (
  [u0, u1]: Span,
  [y0, y1]: Span,
  d: number,
  count: number,
  finish: Finish,
  edge?: Edge,
  pullAt?: (i: number, a: number, b: number) => number,
): LocalPart[] => {
  const width = (u1 - u0) / count;
  const face: Span = [d, d + FRONT.depth];
  return Array.from({ length: count }, (_, i) => {
    const a = u0 + i * width + FRONT.gap / 2;
    const b = a + width - FRONT.gap;
    const panel = local(finish, [a, b], [y0, y1], face);
    if (!edge || !pullAt) return [panel];
    const middle = pullAt(i, a, b);
    const top =
      edge === "top" ? y1 - PULL.inset : y0 + PULL.inset + PULL.height;
    return [
      panel,
      local(
        "stainless",
        [middle - PULL.width / 2, middle + PULL.width / 2],
        [top - PULL.height, top],
        [face[1], face[1] + PULL.depth],
      ),
    ];
  }).flat();
};

const centred = (_: number, a: number, b: number) => (a + b) / 2;

// Drawer fronts, or plain panels without a pull: pulls centred on each
export const fronts = (
  u: Span,
  y: Span,
  d: number,
  count: number,
  pull?: Edge,
  finish: Finish = "walnut",
): LocalPart[] => [
  backing(u, y, d),
  ...panels(u, y, d, count, finish, pull, centred),
];

// Doors open in pairs, hinged on their outside edges, so each pair's pulls
// sit together either side of the gap between them. With an odd count the
// last door opens on its own toward `lone`: -1 for its low u edge, 1 for its
// high u edge, away from its hinge
const doorPull =
  (count: number, lone: -1 | 1) => (i: number, a: number, b: number) => {
    const paired = i < count - (count % 2);
    const opens = paired ? (i % 2 === 0 ? 1 : -1) : lone;
    const reach = PULL.side + PULL.width / 2;
    return opens > 0 ? b - reach : a + reach;
  };

export const doors = (
  u: Span,
  y: Span,
  d: number,
  count: number,
  edge: Edge,
  lone: -1 | 1 = 1,
  finish: Finish = "walnut",
): LocalPart[] => [
  backing(u, y, d),
  ...panels(u, y, d, count, finish, edge, doorPull(count, lone)),
];

// A base cabinet's fronts: a drawer over each door, pulls along the top
export const DRAWER_HEIGHT = 0.5;

export const drawersOverDoors = (
  u: Span,
  [y0, y1]: Span,
  d: number,
  count: number,
  lone: -1 | 1 = 1,
): LocalPart[] => {
  const split = y1 - DRAWER_HEIGHT;
  return [
    backing(u, [y0, y1], d),
    ...panels(u, [split, y1], d, count, "walnut", "top", centred),
    ...panels(
      u,
      [y0, split - FRONT.gap],
      d,
      count,
      "walnut",
      "top",
      doorPull(count, lone),
    ),
  ];
};

// 12" square floor tile laid over a room, matching the wall tile, with
// 3/16" grout lines standing just proud of it. The grid is centred on the
// room, so the cut tiles at opposite edges match
export const FLOOR_TILE = { size: 1, grout: 3 / 16 / 12, thickness: 0.02 };

const gridLines = ([a0, a1]: Span, size: number) => {
  const middle = (a0 + a1) / 2;
  const lines: number[] = [];
  for (
    let a = middle - Math.floor((middle - a0) / size) * size;
    a < a1 - 1e-9;
    a += size
  ) {
    if (a > a0 + 1e-9) lines.push(a);
  }
  return lines;
};

export const tileFloor = ({ x, z }: Rect): Part[] => {
  const top = FLOOR + FLOOR_TILE.thickness;
  const joint: Span = [top, top + 0.005];
  const g = FLOOR_TILE.grout / 2;
  return [
    part("floorTile", x, [FLOOR, top], z),
    ...gridLines(x, FLOOR_TILE.size).map((at) =>
      part("grout", [at - g, at + g], joint, z),
    ),
    ...gridLines(z, FLOOR_TILE.size).map((at) =>
      part("grout", x, joint, [at - g, at + g]),
    ),
  ];
};

// Anything standing on the floor, or starting within this far above it, is
// in the way when walking; headers, mirrors and wall cabinets are not, and
// nor is anything barely off it, like floor tile
const BLOCKING_HEIGHT = 1.5;
const TRIP_HEIGHT = 0.04;

export const getFootprints = (parts: Part[], offsetX = 0): Rect[] =>
  parts
    .filter(
      ({ position, size }) =>
        position[1] - size[1] / 2 < FLOOR + BLOCKING_HEIGHT &&
        position[1] + size[1] / 2 > FLOOR + TRIP_HEIGHT,
    )
    .map(({ position: [x, , z], size: [w, , d] }) => ({
      x: [offsetX + x - w / 2, offsetX + x + w / 2],
      z: [z - d / 2, z + d / 2],
    }));

interface PartsProps {
  parts: Part[];
  // Chosen colours that stand in for a finish's own, like the wall tile's
  colors?: Partial<Record<Finish, string>>;
}

// Veneer is laid out by where it is in the services module rather than
// stretched over each box, so the grain runs on from one door to the next and
// from each drawer front down into the door below it. The grain runs up the
// fronts and sides, and along z on tops; a point's texture coordinates count
// copies of the veneer, along the grain then across it
export const veneerUv = (
  [x, y, z]: [number, number, number],
  [nx, ny]: [number, number, number],
): [number, number] => {
  const top = Math.abs(ny) > 0.5;
  const along = top ? z : y;
  const across = Math.abs(nx) > 0.5 ? z : x;
  return [along / VENEER_SIZE, across / VENEER_SIZE];
};

const VeneerBox = ({ position, size }: Box) => {
  const geometry = useRef<any>(null);
  const [px, py, pz] = position;
  useLayoutEffect(() => {
    const { position: points, normal, uv } = geometry.current.attributes;
    for (let i = 0; i < uv.count; i++) {
      const [u, v] = veneerUv(
        [points.getX(i) + px, points.getY(i) + py, points.getZ(i) + pz],
        [normal.getX(i), normal.getY(i), normal.getZ(i)],
      );
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
  }, [px, py, pz, size]);
  return <boxGeometry ref={geometry} args={size} />;
};

// The veneer's roughness map averages about a third, glossier than the
// satin lacquer on walnut cabinets, so it's scaled up to about a half
const VENEER_ROUGHNESS = 1.5;

export const Parts = ({ parts, colors }: PartsProps) => {
  const veneer = useVeneer();
  return (
    <>
      {parts.map(({ position, size, finish, round }) => {
        const veneered = finish === "walnut" && !round;
        return (
          <mesh
            key={`${finish}-${position.join()}-${size.join()}`}
            position={position}
            scale={round ? size : undefined}
            receiveShadow
          >
            {round ? (
              <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
            ) : veneered ? (
              <VeneerBox position={position} size={size} />
            ) : (
              <boxGeometry args={size} />
            )}
            {veneered ? (
              <meshStandardMaterial {...veneer} roughness={VENEER_ROUGHNESS} />
            ) : (
              <meshStandardMaterial
                {...FINISHES[finish]}
                {...(colors?.[finish] && { color: colors[finish] })}
              />
            )}
          </mesh>
        );
      })}
    </>
  );
};
