import React from "react";
import { Stack, Tooltip, Avatar, useMediaQuery } from "@mui/material";

export const COLORS = {
  white: "#e3d7c4",
  taupe: "#a19b87",
  copper: "#554a3d",
  grey: "#94948b",
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

  const borderStyle = "3px solid #01257D";

  return (
    <Stack
      position="absolute"
      left={16}
      bottom={16}
      direction="row"
      spacing={1}
      borderRadius="0.5rem"
      border="1px dashed #01257D"
      padding={{ xs: "10px", sm: "13px" }}
    >
      <Tooltip title="White">
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
      <Tooltip title="Taupe">
        <Avatar
          onClick={() => handleColor(COLORS.taupe)}
          style={{
            ...colorStyle,
            backgroundColor: COLORS.taupe,
            border: homeColor === COLORS.taupe ? borderStyle : "",
          }}
        >
          {" "}
        </Avatar>
      </Tooltip>
      <Tooltip title="Copper">
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
      <Tooltip title="Grey">
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
