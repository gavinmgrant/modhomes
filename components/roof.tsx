interface RoofProps {
  color: string;
  position: number[];
  width: number | undefined;
}

const Roof = ({ color, position, width }: RoofProps) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.75, 39]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} castShadow receiveShadow />
    </mesh>
  );
};

export default Roof;