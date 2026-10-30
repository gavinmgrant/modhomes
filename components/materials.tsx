import React from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import Swatch from "./swatch";

// All textures are CC0 textures from: https://cc0textures.com/
export const TEXTURES = {
  walnut: {
    map: "/images/materials/WoodFloor046_1K_Color.jpg",
    normalMap: "/images/materials/WoodFloor046_1K_Normal.jpg",
    roughnessMap: "/images/materials/WoodFloor046_1K_Roughness.jpg",
  },
  bamboo: {
    map: "/images/materials/WoodFloor051_1K_Color.jpg",
    normalMap: "/images/materials/WoodFloor051_1K_Normal.jpg",
    roughnessMap: "/images/materials/WoodFloor051_1K_Roughness.jpg",
  },
  concrete: {
    map: "/images/materials/Concrete023_1K_Color.jpg",
    normalMap: "/images/materials/Concrete023_1K_Normal.jpg",
    roughnessMap: "/images/materials/Concrete023_1K_Roughness.jpg",
  },
  carpet: {
    map: "/images/materials/Fabric028_1K_Color.jpg",
    normalMap: "/images/materials/Fabric028_1K_Normal.jpg",
    roughnessMap: "/images/materials/Fabric028_1K_Roughness.jpg",
  },
};

// useTexture uploads to the GPU straight away, but R3F only sets a texture's
// color space once it's put on a material, and an uploaded texture keeps the
// one it went up with. Set it first, as R3F would, or finishes not yet on the
// floor render washed out when picked
const FloorTexture = ({ material }: { material: keyof typeof TEXTURES }) => {
  const gl = useThree((state) => state.gl);
  useTexture(TEXTURES[material], (textures) => {
    (textures as any[]).forEach((texture) => {
      texture.colorSpace = gl.outputColorSpace;
    });
  });
  return null;
};

// Loads every floor finish under the scene's Suspense, keyed the same as
// Module's useTexture call, so picking another finish swaps it in place
// instead of suspending the model back to the loader
export const FloorTextures = () => (
  <>
    {(Object.keys(TEXTURES) as (keyof typeof TEXTURES)[]).map((material) => (
      <FloorTexture key={material} material={material} />
    ))}
  </>
);

// drei's "city" lighting preset (Poly Haven's Potsdamer Platz, CC0), served
// from this site rather than drei's development CDN
export const CITY_ENVIRONMENT = "/images/environments/potsdamer_platz_1k.hdr";

const OPTIONS = [
  { name: "Walnut", material: "walnut" },
  { name: "Bamboo", material: "bamboo" },
  { name: "Concrete", material: "concrete" },
  { name: "Carpet", material: "carpet" },
] as const;

interface MaterialsProps {
  floorMaterial: string;
  handleFloorMaterial: (floorMaterial: any) => void;
}

const Materials = ({ floorMaterial, handleFloorMaterial }: MaterialsProps) => (
  <>
    {OPTIONS.map(({ name, material }) => (
      <Swatch
        key={name}
        name={name}
        background={`url(${TEXTURES[material].map}) center`}
        selected={floorMaterial === material}
        onSelect={() => handleFloorMaterial(material)}
      />
    ))}
  </>
);

export default Materials;
