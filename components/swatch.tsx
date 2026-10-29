import React from "react";
import { ButtonBase, Tooltip, useMediaQuery } from "@mui/material";
import { FOCUS_RING, INK, PAPER } from "./panel";

interface SwatchProps {
  name: string;
  background: string;
  selected: boolean;
  onSelect: () => void;
}

const Swatch = ({ name, background, selected, onSelect }: SwatchProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");
  // 40-44px tap target around a smaller visible circle
  const target = isMobile ? 40 : 44;
  const dot = isMobile ? 28 : 30;

  return (
    <Tooltip title={name}>
      <ButtonBase
        aria-label={name}
        aria-pressed={selected}
        data-testid={`${name.toLowerCase()}-option`}
        onClick={onSelect}
        sx={{
          width: target,
          height: target,
          flexShrink: 0,
          borderRadius: "50%",
          ...FOCUS_RING,
        }}
      >
        <span
          style={{
            width: dot,
            height: dot,
            borderRadius: "50%",
            background,
            backgroundSize: "cover",
            boxShadow: selected
              ? `0 0 0 2px ${PAPER}, 0 0 0 4px ${INK}`
              : "inset 0 0 0 1px rgba(19, 20, 20, 0.15)",
            transition: "box-shadow 150ms ease-out",
          }}
        />
      </ButtonBase>
    </Tooltip>
  );
};

export default Swatch;
