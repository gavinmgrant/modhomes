import { Edges, useTexture } from "@react-three/drei";
import Wall from "./wall";
import { COLORS } from "./colors";
import { TEXTURES } from "./materials";

interface ModuleProps {
  color: string;
  position: number[];
  envelopeOn: boolean;
  floorMaterial: string;
}

const Module = ({
  color,
  position,
  envelopeOn,
  floorMaterial,
}: ModuleProps) => {
  const texture = (TEXTURES as any)[floorMaterial];
  const floorMaterialProps = useTexture(texture);

  return (
    <mesh position={position}>
      {envelopeOn && <Wall color={color} position={[0, 0.75, 20]}></Wall>}
      <mesh position={[0, -4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.75, 1, 40]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>

      <mesh position={[0, -4, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[39, 0.1, 8]} />
        <meshStandardMaterial {...floorMaterialProps} />
      </mesh>
      <mesh position={[0, 3.9, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[39, 0.1, 8]} />
        <meshStandardMaterial
          color={COLORS.gyp}
          metalness={0.1}
          roughness={0.1}
        />
      </mesh>

      <mesh position={[3.625, -0.2, 19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>
      <mesh position={[-3.625, -0.05, 19.75]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 7.9, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        <Edges />
      </mesh>

      <mesh position={[0, -0.05, 19.5]} receiveShadow>
        <boxGeometry args={[8, 7.9, 0.05]} />
        <meshStandardMaterial
          color={COLORS.gyp}
          metalness={0.1}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, -0.05, -19.5]} receiveShadow>
        <boxGeometry args={[8, 7.9, 0.05]} />
        <meshStandardMaterial
          color={COLORS.gyp}
          metalness={0.1}
          roughness={0.1}
        />
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
