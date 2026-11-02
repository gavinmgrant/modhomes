// The concrete stem walls under the modules, which they cantilever past by
// `inset` all round. Units are feet
export const FOUNDATION = { height: 1.5, inset: 0.5, wall: 8 / 12 };

export type WallBox = {
  position: [number, number, number];
  size: [number, number, number];
};

// 8" walls round the edges of a width (x) by depth (z) footprint centred on
// 0, the end walls between the side walls. With an open side (-1 for -x, 1
// for +x) there's no wall along it, and the end walls run on to its edge, to
// meet another foundation there
export const getStemWalls = (
  width: number,
  depth: number,
  open?: -1 | 1,
): WallBox[] => {
  const { height, wall } = FOUNDATION;
  const [halfW, halfD] = [width / 2, depth / 2];
  const sides = ([-1, 1] as const)
    .filter((x) => x !== open)
    .map((x): WallBox => ({
      position: [x * (halfW - wall / 2), 0, 0],
      size: [wall, height, depth],
    }));
  const [x0, x1] = [
    open === -1 ? -halfW : -halfW + wall,
    open === 1 ? halfW : halfW - wall,
  ];
  const ends = [-1, 1].map((z): WallBox => ({
    position: [(x0 + x1) / 2, 0, z * (halfD - wall / 2)],
    size: [x1 - x0, height, wall],
  }));
  return [...sides, ...ends];
};

interface FoundationProps {
  color: string;
  position: number[];
  width: number;
}

const Foundation = ({ color, position, width }: FoundationProps) => {
  return (
    <group position={position}>
      {getStemWalls(width, 40 - 2 * FOUNDATION.inset).map((wall) => (
        <mesh
          key={wall.position.join()}
          position={wall.position}
          castShadow
          receiveShadow
        >
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
};

export default Foundation;
