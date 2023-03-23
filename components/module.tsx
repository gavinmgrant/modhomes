interface ModuleProps {
  color: string;
  position: number[];
}

const Module = ({ color, position }: ModuleProps) => {
  return (
    <mesh position={position}>
      <mesh position={[0, -4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.75, 1, 40]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[3.625, 0, 19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 8, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-3.625, 0, 19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 8, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[3.625, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 8, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-3.625, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 8, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[3.625, 0, -19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 8, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-3.625, 0, -19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 8, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 4.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.75, 1, 40]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
    </mesh>
  );
};

export default Module;
