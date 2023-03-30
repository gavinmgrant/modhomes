import React from "react";
import { Stack, Tooltip, Avatar, useMediaQuery } from "@mui/material";

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

interface MaterialsProps {
  floorMaterial: string;
  handleFloorMaterial: (floorMaterial: any) => void;
}

const Materials = ({ floorMaterial, handleFloorMaterial }: MaterialsProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");

  const colorStyle = {
    borderRadius: "10rem",
    cursor: "pointer",
    width: isMobile ? 36 : 40,
    height: isMobile ? 36 : 40,
  };

  const borderStyle = "3px solid #131414";

  return (
    <Stack
      position="absolute"
      left={16}
      bottom={16}
      direction="row"
      spacing={1}
      borderRadius="0.5rem"
      border="1px dashed #131414"
      padding={{ xs: "10px", sm: "13px" }}
      sx={{ backdropFilter: "blur(5px)" }}
    >
      <Tooltip title="Walnut" role="tooltip">
        <Avatar
          onClick={() => handleFloorMaterial("walnut")}
          style={{
            ...colorStyle,
            backgroundImage: `url(${TEXTURES.walnut.map})`,
            border: floorMaterial === "walnut" ? borderStyle : "",
          }}
        >
          {" "}
        </Avatar>
      </Tooltip>
      <Tooltip title="Bamboo" role="tooltip">
        <Avatar
          onClick={() => handleFloorMaterial("bamboo")}
          style={{
            ...colorStyle,
            backgroundImage: `url(${TEXTURES.bamboo.map})`,
            border: floorMaterial === "bamboo" ? borderStyle : "",
          }}
        >
          {" "}
        </Avatar>
      </Tooltip>
      <Tooltip title="Concrete" role="tooltip">
        <Avatar
          onClick={() => handleFloorMaterial("concrete")}
          style={{
            ...colorStyle,
            backgroundImage: `url(${TEXTURES.concrete.map})`,
            border: floorMaterial === "concrete" ? borderStyle : "",
          }}
        >
          {" "}
        </Avatar>
      </Tooltip>
      <Tooltip title="Carpet" role="tooltip">
        <Avatar
          onClick={() => handleFloorMaterial("carpet")}
          style={{
            ...colorStyle,
            backgroundImage: `url(${TEXTURES.carpet.map})`,
            border: floorMaterial === "carpet" ? borderStyle : "",
          }}
        >
          {" "}
        </Avatar>
      </Tooltip>
    </Stack>
  );
};

export default Materials;
