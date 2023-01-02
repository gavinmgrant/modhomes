import React from "react";
import { Stack, Tooltip, Avatar, useMediaQuery } from "@mui/material";

export const COLORS = {
  white: "#e3d7c4",
  taupe: "#a19b87",
  copper: "#554a3d",
  grey: "#94948b",
  roof: "#faf9f6",
};

interface ColorProps {
  homeColor: string;
  handleColor: (color: string) => void;
}

const Colors = ({ homeColor, handleColor }: ColorProps) => {
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
    >
      <Tooltip title="White" role="tooltip">
        <Avatar
          onClick={() => handleColor(COLORS.white)}
          style={{
            ...colorStyle,
            backgroundColor: COLORS.white,
            border: homeColor === COLORS.white ? borderStyle : "",
          }}
        >
          {" "}
        </Avatar>
      </Tooltip>
      <Tooltip title="Taupe" role="tooltip">
        <Avatar
          onClick={() => handleColor(COLORS.taupe)}
          style={{
            ...colorStyle,
            backgroundColor: COLORS.taupe,
            border: homeColor === COLORS.taupe ? borderStyle : "",
          }}
        >
          <span data-testid="taupe-option"> </span>
        </Avatar>
      </Tooltip>
      <Tooltip title="Copper" role="tooltip">
        <Avatar
          onClick={() => handleColor(COLORS.copper)}
          style={{
            ...colorStyle,
            backgroundColor: COLORS.copper,
            border: homeColor === COLORS.copper ? borderStyle : "",
          }}
        >
          {" "}
        </Avatar>
      </Tooltip>
      <Tooltip title="Grey" role="tooltip">
        <Avatar
          onClick={() => handleColor(COLORS.grey)}
          style={{
            ...colorStyle,
            backgroundColor: COLORS.grey,
            border: homeColor === COLORS.grey ? borderStyle : "",
          }}
        >
          {" "}
        </Avatar>
      </Tooltip>
    </Stack>
  );
};

export default Colors;
