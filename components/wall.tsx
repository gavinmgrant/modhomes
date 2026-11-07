// The siding panel's depth, centred on the module's end, so its outer face is
// half this past it. Units are feet
export const WALL_PANEL_DEPTH = 0.625;

interface WallProps {
  color: string;
  position: [number, number, number];
}

const Wall = ({ color, position }: WallProps) => {
  return (
    <>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[8, 11.5, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[7.8, 11.25, WALL_PANEL_DEPTH]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
    </>
  );
};

export default Wall;
