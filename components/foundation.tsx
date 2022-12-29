interface FoundationProps {
  color: string;
  position: number[];
  width: number;
}

const Foundation = ({ color, position, width }: FoundationProps) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 1.5, 39]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} castShadow receiveShadow />
    </mesh>
  );
};

export default Foundation;