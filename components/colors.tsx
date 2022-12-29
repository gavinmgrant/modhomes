import React from "react";
import { Stack, Tooltip, Avatar } from "@mui/material";

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
  const colorStyle = {
    borderRadius: "10rem",
    cursor: "pointer",
    width: 40,
    height: 40,
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      style={{ position: "absolute", left: 16, bottom: 16 }}
    >
      <Tooltip title="White">
        <Avatar
          onClick={() => handleColor(COLORS.white)}
          style={{
            ...colorStyle,
            backgroundColor: COLORS.white,
            border: homeColor === COLORS.white ? "2px solid #01257D" : "",
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
            border: homeColor === COLORS.taupe ? "2px solid #01257D" : "",
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
            border: homeColor === COLORS.copper ? "2px solid #01257D" : "",
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
            border: homeColor === COLORS.grey ? "2px solid #01257D" : "",
          }}
        >
          {" "}
        </Avatar>
      </Tooltip>
    </Stack>
  );
};

export default Colors;
