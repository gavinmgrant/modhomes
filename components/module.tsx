import { Edges } from "@react-three/drei"
import Wall from "./wall";

interface ModuleProps {
  color: string;
  position: number[];
  envelopeOn: boolean;
}

const Module = ({ color, position, envelopeOn }: ModuleProps) => {
  return (
    <mesh position={position}>
      {envelopeOn && <Wall color={color} position={[0, 0.75, 20]}></Wall>}
      <mesh position={[0, -4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.75, 1, 40]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>
      <mesh position={[3.625, -0.05, 19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>
      <mesh position={[-3.625, -0.05, 19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>

      <mesh position={[3.625, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>
      <mesh position={[-3.625, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>

      <mesh position={[3.625, -0.05, -19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>
      <mesh position={[-3.625, -0.05, -19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>
      <mesh position={[0, 4.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.75, 1, 40]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>
      {envelopeOn && <Wall color={color} position={[0, 0.75, -20]}></Wall>}
    </mesh>
  );
};

export default Module;
