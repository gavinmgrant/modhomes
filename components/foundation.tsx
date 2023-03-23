import { Edges } from "@react-three/drei"

interface FoundationProps {
  color: string;
  position: number[];
  width: number | undefined;
}

const Foundation = ({ color, position, width }: FoundationProps) => {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[width, 1.5, 39]} />
      <meshStandardMaterial color={color} />
      <Edges />
    </mesh>
  );
};

export default Foundation;
