import React from "react";
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
