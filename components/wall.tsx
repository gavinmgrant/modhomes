interface WallProps {
  color: string;
  position: number[];
}

const Wall = ({ color, position }: WallProps) => {
  return (
    <>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[8, 11.5, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[7.8, 11.25, 0.625]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
    </>
  );
};

export default Wall;
