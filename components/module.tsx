import Wall from "./wall";
import { COLORS } from "./colors";
import { TEXTURES, useFloorTexture } from "./materials";
import AssembleIn, {
  ASSEMBLY,
  CEILING_OFFSET,
  FLOOR_OFFSET,
  WALL_OFFSET,
  WALL_ORDER,
  getWallStep,
} from "./assembly";
import type { Rect } from "./stair";

// 4" square steel posts, set 1" in from the module's long edges so that where
// two modules meet, their posts stand 2" apart
export const POST_SIZE = 4 / 12;
export const POST_INSET = 1 / 12;
const POST_X = 4 - POST_INSET - POST_SIZE / 2;
// The corner posts sit flush with the module's ends
const POST_END_Z = 20 - POST_SIZE / 2;

type SlabPiece = { x: number; z: number; width: number; depth: number };

// Splits a slab (width along x, depth along z, centred on 0) into the pieces
// around a rectangular hole: full-depth strips beside it, then the parts in
// front of and behind it
export const getSlabPieces = (
  width: number,
  depth: number,
  hole?: Rect,
): SlabPiece[] => {
  if (!hole) return [{ x: 0, z: 0, width, depth }];
  const [halfW, halfD] = [width / 2, depth / 2];
  const [x0, x1] = [Math.max(hole.x[0], -halfW), Math.min(hole.x[1], halfW)];
  const [z0, z1] = [Math.max(hole.z[0], -halfD), Math.min(hole.z[1], halfD)];
  const pieces: SlabPiece[] = [];
  if (x0 > -halfW) {
    pieces.push({ x: (x0 - halfW) / 2, z: 0, width: x0 + halfW, depth });
  }
  if (x1 < halfW) {
    pieces.push({ x: (x1 + halfW) / 2, z: 0, width: halfW - x1, depth });
  }
  if (z0 > -halfD) {
    pieces.push({
      x: (x0 + x1) / 2,
      z: (z0 - halfD) / 2,
      width: x1 - x0,
      depth: z0 + halfD,
    });
  }
  if (z1 < halfD) {
    pieces.push({
      x: (x0 + x1) / 2,
      z: (z1 + halfD) / 2,
      width: x1 - x0,
      depth: halfD - z1,
    });
  }
  return pieces;
};

interface ModuleProps {
  color: string;
  position: number[];
  envelopeOn: boolean;
  floorMaterial: string;
  // Openings in module coordinates, e.g. where a stair passes between stories
  floorOpening?: Rect;
  ceilingOpening?: Rect;
  // Slide the end walls in and lower the finished floor and ceiling onto the
  // frame, as part of the landing hero's assembly
  animateIn?: boolean;
}

// The views light the home with an open-sky environment that nothing in the
// room shades, so the floor took in as much light as if it were outdoors and
// came out far lighter than its swatch. It takes a fifth of that light, and
// its texture is darkened a little, so it reads close to its swatch
const FLOOR_LIGHTING = { envMapIntensity: 0.2, color: "#bbbbbb" };

const Module = ({
  color,
  position,
  envelopeOn,
  floorMaterial,
  floorOpening,
  ceilingOpening,
  animateIn = false,
}: ModuleProps) => {
  const floorMaterialProps = useFloorTexture(
    floorMaterial as keyof typeof TEXTURES,
  );

  return (
    <mesh position={position}>
      {/* End walls with their plasterboard lining, front (z > 0) first */}
      {[1, -1].map((end) => (
        <AssembleIn
          key={`end-wall${end}`}
          from={[0, 0, end * WALL_OFFSET]}
          step={
            animateIn
              ? getWallStep(end > 0 ? WALL_ORDER.front : WALL_ORDER.back)
              : undefined
          }
        >
          {envelopeOn && <Wall color={color} position={[0, 0.75, end * 20]} />}
          <mesh position={[0, -0.05, end * 19.5]} receiveShadow>
            <boxGeometry args={[8, 7.9, 0.05]} />
            <meshStandardMaterial
              color={COLORS.gyp}
              metalness={0.1}
              roughness={0.1}
            />
          </mesh>
        </AssembleIn>
      ))}
      {getSlabPieces(7.75, 40, floorOpening).map((piece) => (
        <mesh
          key={`floor-frame-${piece.x}-${piece.z}`}
          position={[piece.x, -4.5, piece.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[piece.width, 1, piece.depth]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Floor and ceiling boards are rotated so their long side runs along z */}
      <AssembleIn
        from={[0, FLOOR_OFFSET, 0]}
        step={animateIn ? ASSEMBLY.floor : undefined}
      >
        {getSlabPieces(8, 39, floorOpening).map((piece) => (
          <mesh
            key={`floor-${piece.x}-${piece.z}`}
            position={[piece.x, -4, piece.z]}
            rotation={[0, -Math.PI / 2, 0]}
          >
            <boxGeometry args={[piece.depth, 0.1, piece.width]} />
            <meshStandardMaterial {...floorMaterialProps} {...FLOOR_LIGHTING} />
          </mesh>
        ))}
      </AssembleIn>
      <AssembleIn
        from={[0, CEILING_OFFSET, 0]}
        step={animateIn ? ASSEMBLY.ceiling : undefined}
      >
        {getSlabPieces(8, 39, ceilingOpening).map((piece) => (
          <mesh
            key={`ceiling-${piece.x}-${piece.z}`}
            position={[piece.x, 3.9, piece.z]}
            rotation={[0, -Math.PI / 2, 0]}
          >
            <boxGeometry args={[piece.depth, 0.1, piece.width]} />
            <meshStandardMaterial
              color={COLORS.gyp}
              metalness={0.1}
              roughness={0.1}
            />
          </mesh>
        ))}
      </AssembleIn>

      <mesh position={[POST_X, -0.2, POST_END_Z]} castShadow receiveShadow>
        <boxGeometry args={[POST_SIZE, 7.9, POST_SIZE]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-POST_X, -0.05, POST_END_Z]} castShadow receiveShadow>
        <boxGeometry args={[POST_SIZE, 7.9, POST_SIZE]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[POST_X, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[POST_SIZE, 7.9, POST_SIZE]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-POST_X, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[POST_SIZE, 7.9, POST_SIZE]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[POST_X, -0.05, -POST_END_Z]} castShadow receiveShadow>
        <boxGeometry args={[POST_SIZE, 7.9, POST_SIZE]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-POST_X, -0.05, -POST_END_Z]} castShadow receiveShadow>
        <boxGeometry args={[POST_SIZE, 7.9, POST_SIZE]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      {getSlabPieces(7.75, 40, ceilingOpening).map((piece) => (
        <mesh
          key={`roof-frame-${piece.x}-${piece.z}`}
          position={[piece.x, 4.4, piece.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[piece.width, 1, piece.depth]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </mesh>
  );
};

export default Module;
