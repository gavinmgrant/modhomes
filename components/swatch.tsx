import React, { forwardRef } from "react";
import { ButtonBase, Tooltip, useMediaQuery } from "@mui/material";
import { FOCUS_RING, INK, PAPER } from "./panel";

interface SwatchProps {
  name: string;
  background: string;
  selected: boolean;
  onSelect: () => void;
  // Set when the swatch opens a list of options instead of being one
  expanded?: boolean;
  controls?: string;
}

const Swatch = forwardRef<HTMLButtonElement, SwatchProps>(
  ({ name, background, selected, onSelect, expanded, controls }, ref) => {
    const isMobile = useMediaQuery("(max-width:900px)");
    const opens = expanded !== undefined;
    // 40-44px tap target around a smaller visible circle
    const target = isMobile ? 40 : 44;
    const dot = isMobile ? 28 : 30;

    return (
      // No tooltip while its options are showing, so it doesn't cover them
      <Tooltip title={expanded ? "" : name}>
        <ButtonBase
          ref={ref}
          aria-label={name}
          aria-pressed={opens ? undefined : selected}
          aria-expanded={expanded}
          aria-controls={expanded ? controls : undefined}
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
              boxShadow: selected
                ? `0 0 0 2px ${PAPER}, 0 0 0 4px ${INK}`
                : "inset 0 0 0 1px rgba(19, 20, 20, 0.15)",
              transition: "box-shadow 150ms ease-out",
            }}
          />
        </ButtonBase>
      </Tooltip>
    );
  },
);

Swatch.displayName = "Swatch";

export default Swatch;
