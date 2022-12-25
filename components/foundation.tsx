const Foundation = ({ color, position, width }: any) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 1.5, 39]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
    </mesh>
  );
};

export default Foundation;