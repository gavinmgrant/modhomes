interface RoofProps {
  color: string;
  position: number[];
  width: number | undefined;
}

const Roof = ({ color, position, width }: RoofProps) => {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[width, 0.75, 39]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
    </mesh>
  );
};

export default Roof;
