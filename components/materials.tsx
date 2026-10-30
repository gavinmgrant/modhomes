import React from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import SwatchPicker from "./swatchpicker";
import { COLORS } from "./colors";

// All textures are CC0 textures from ambientCG (formerly cc0textures.com):
// https://ambientcg.com/
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
    map: "/images/materials/Concrete036_1K_Color.jpg",
    normalMap: "/images/materials/Concrete036_1K_Normal.jpg",
    roughnessMap: "/images/materials/Concrete036_1K_Roughness.jpg",
  },
  carpet: {
    map: "/images/materials/Carpet014_1K_Color.jpg",
    normalMap: "/images/materials/Carpet014_1K_Normal.jpg",
    roughnessMap: "/images/materials/Carpet014_1K_Roughness.jpg",
  },
};

// Each floor slab stretches its texture over 39 x 8 ft, which suits the
// long boards of the wood floors. Concrete and carpet are tiled instead,
// each tile covering this many feet square
const TILE_SIZE: Partial<Record<keyof typeof TEXTURES, number>> = {
  concrete: 8,
  carpet: 2,
};
const SLAB = { length: 39, width: 8 };
// three's RepeatWrapping, as three has no type definitions installed here
const REPEAT_WRAPPING = 1000;

export const getFloorRepeat = (material: keyof typeof TEXTURES) => {
  const size = TILE_SIZE[material];
  return size ? [SLAB.length / size, SLAB.width / size] : [1, 1];
};

// useTexture uploads to the GPU straight away, but R3F only sets a texture's
// color space once it's put on a material, and an uploaded texture keeps the
// one it went up with. Set it first, as R3F would, or finishes not yet on the
// floor render washed out when picked. Tiling is set before upload too
const FloorTexture = ({ material }: { material: keyof typeof TEXTURES }) => {
  const gl = useThree((state) => state.gl);
  const [u, v] = getFloorRepeat(material);
  useTexture(TEXTURES[material], (textures) => {
    (textures as any[]).forEach((texture) => {
      texture.colorSpace = gl.outputColorSpace;
      if (TILE_SIZE[material]) {
        texture.wrapS = texture.wrapT = REPEAT_WRAPPING;
        texture.repeat.set(u, v);
      }
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

export const FLOOR_OPTIONS = (
  [
    ["Walnut", "walnut"],
    ["Bamboo", "bamboo"],
    ["Concrete", "concrete"],
    ["Carpet", "carpet"],
  ] as const
).map(([name, material]) => ({
  name,
  background: `url(${TEXTURES[material].map}) center / cover`,
  value: material,
}));

// The kitchen backsplash and bathroom wall tile: four of Daltile's Color
// Wheel Classic matte neutrals, sampled from their swatches
export const TILE_OPTIONS = [
  { name: "Arctic White", value: "#f4f1ec" },
  { name: "Urban Putty", value: COLORS.tile },
  { name: "Desert Gray", value: "#a9adad" },
  { name: "Chalkboard", value: "#575b5e" },
].map((option) => ({ ...option, background: option.value }));

interface MaterialsProps {
  floorMaterial: string;
  handleFloorMaterial: (floorMaterial: any) => void;
  tileColor: string;
  handleTileColor: (color: string) => void;
  hasTile: boolean;
}

const Materials = ({
  floorMaterial,
  handleFloorMaterial,
  tileColor,
  handleTileColor,
  hasTile,
}: MaterialsProps) => (
  <>
    <SwatchPicker
      label="Floor"
      options={FLOOR_OPTIONS}
      value={floorMaterial}
      onChange={handleFloorMaterial}
    />
    {hasTile && (
      <SwatchPicker
        label="Tile"
        options={TILE_OPTIONS}
        value={tileColor}
        onChange={handleTileColor}
      />
    )}
  </>
);

export default Materials;
