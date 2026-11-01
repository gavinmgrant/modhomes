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

// three's NoColorSpace, for textures that hold data rather than colors
const NO_COLOR_SPACE = "";

// The color space for each of a set of maps: sRGB for the color map, and
// none for the normal and roughness maps, which hold data. R3F would put
// them all in sRGB, and decoding a roughness map as a color darkens it, so
// the surface shines like a mirror with the sky in it
const getColorSpace = (key: string, gl: any) =>
  key === "map" ? gl.outputColorSpace : NO_COLOR_SPACE;

// useTexture uploads to the GPU straight away, but R3F only sets a texture's
// color space once it's put on a material, and an uploaded texture keeps the
// one it went up with. Set it first, or finishes not yet on the floor render
// washed out when picked. Tiling is set before upload too. Module loads its
// floor with this as well, for views without FloorTextures
export const useFloorTexture = (material: keyof typeof TEXTURES) => {
  const gl = useThree((state) => state.gl);
  const [u, v] = getFloorRepeat(material);
  return useTexture(TEXTURES[material], (textures) => {
    (textures as any[]).forEach((texture, i) => {
      texture.colorSpace = getColorSpace(
        Object.keys(TEXTURES[material])[i],
        gl,
      );
      if (TILE_SIZE[material]) {
        texture.wrapS = texture.wrapT = REPEAT_WRAPPING;
        texture.repeat.set(u, v);
      }
    });
  });
};

const FloorTexture = ({ material }: { material: keyof typeof TEXTURES }) => {
  useFloorTexture(material);
  return null;
};

// Loads every floor finish under the scene's Suspense, keyed the same as
// Module's, so picking another finish swaps it in place
// instead of suspending the model back to the loader
export const FloorTextures = () => (
  <>
    {(Object.keys(TEXTURES) as (keyof typeof TEXTURES)[]).map((material) => (
      <FloorTexture key={material} material={material} />
    ))}
  </>
);

// Walnut veneer for the cabinets and the bathroom vanity and linen
// cupboard: ambientCG's Wood066, a straight grain running along the image's
// width
const VENEER = {
  map: "/images/materials/Wood066_1K_Color.jpg",
  normalMap: "/images/materials/Wood066_1K_Normal.jpg",
  roughnessMap: "/images/materials/Wood066_1K_Roughness.jpg",
};

// One copy of the veneer covers this many feet square
export const VENEER_SIZE = 4;

// Veneer is laid out by position in feet, so its texture coordinates run
// well past 1 and it's always tiled. Its color spaces are set before upload,
// as FloorTexture's are
export const useVeneer = () => {
  const gl = useThree((state) => state.gl);
  return useTexture(VENEER, (textures) => {
    (textures as any[]).forEach((texture, i) => {
      texture.colorSpace = getColorSpace(Object.keys(VENEER)[i], gl);
      texture.wrapS = texture.wrapT = REPEAT_WRAPPING;
    });
  });
};

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
