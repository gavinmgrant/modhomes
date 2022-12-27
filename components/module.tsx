const Module = ({ color, position }: any) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[7.75, 9.75, 40]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} castShadow receiveShadow />
    </mesh>
  );
};

export default Module;