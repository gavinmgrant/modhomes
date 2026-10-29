import { useTexture } from "@react-three/drei";
import Wall from "./wall";
import { COLORS } from "./colors";
import { TEXTURES } from "./materials";
import type { Rect } from "./stair";

type SlabPiece = { x: number; z: number; width: number; depth: number };

// Splits a slab (width along x, depth along z, centred on 0) into the pieces
// around a rectangular hole: full-depth strips beside it, then the parts in
// front of and behind it
export const getSlabPieces = (
  width: number,
  depth: number,
  hole?: Rect
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
}

const Module = ({
  color,
  position,
  envelopeOn,
  floorMaterial,
  floorOpening,
  ceilingOpening,
}: ModuleProps) => {
  const texture = (TEXTURES as any)[floorMaterial];
  const floorMaterialProps = useTexture(texture);

  return (
    <mesh position={position}>
      {envelopeOn && <Wall color={color} position={[0, 0.75, 20]}></Wall>}
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
      {getSlabPieces(8, 39, floorOpening).map((piece) => (
        <mesh
          key={`floor-${piece.x}-${piece.z}`}
          position={[piece.x, -4, piece.z]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <boxGeometry args={[piece.depth, 0.1, piece.width]} />
          <meshStandardMaterial {...floorMaterialProps} />
        </mesh>
      ))}
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

      <mesh position={[3.625, -0.2, 19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-3.625, -0.05, 19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[0, -0.05, 19.5]} receiveShadow>
        <boxGeometry args={[8, 7.9, 0.05]} />
        <meshStandardMaterial
          color={COLORS.gyp}
          metalness={0.1}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, -0.05, -19.5]} receiveShadow>
        <boxGeometry args={[8, 7.9, 0.05]} />
        <meshStandardMaterial
          color={COLORS.gyp}
          metalness={0.1}
          roughness={0.1}
        />
      </mesh>

      <mesh position={[3.625, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-3.625, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[3.625, -0.05, -19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-3.625, -0.05, -19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
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
      {envelopeOn && <Wall color={color} position={[0, 0.75, -20]}></Wall>}
    </mesh>
  );
};

export default Module;
