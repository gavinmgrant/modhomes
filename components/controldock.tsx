import React, { ReactNode } from "react";
import { ToggleButton, ToggleButtonGroup, useMediaQuery } from "@mui/material";
import { IconSun, IconDoor } from "@tabler/icons-react";
import { FOCUS_RING, INK, PANEL, PAPER } from "./panel";
import { getSwatchSize } from "./swatch";

interface ControlDockProps {
  isInside: boolean;
  onViewChange: (inside: boolean) => void;
  label: string;
  children: ReactNode;
  // more controls after the finishes, set apart from them
  aside?: ReactNode;
}

const ControlDock = ({
  isInside,
  onViewChange,
  label,
  children,
  aside,
}: ControlDockProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");

  const view = (value: string, text: string, icon: ReactNode) => (
    <ToggleButton
      value={value}
      aria-label={text}
      sx={{
        gap: 0.75,
        height: 40,
        minWidth: 40,
        padding: isMobile ? 0 : "0 14px",
        border: "none",
        borderRadius: "999px !important",
        color: INK,
        textTransform: "none",
        fontSize: 15,
        "&.Mui-selected, &.Mui-selected:hover": {
          background: INK,
          color: PAPER,
        },
        ...FOCUS_RING,
      }}
    >
      {icon}
      {!isMobile && text}
    </ToggleButton>
  );

  // A swatch's circle sits inside its tap target, so the divider after the
  // view toggle stands off it by as much again, to sit midway between them
  const { target, dot } = getSwatchSize(isMobile);
  const divider = (before = 4) => (
    <div
      style={{
        width: 1,
        height: 24,
        flexShrink: 0,
        margin: `0 4px 0 ${before}px`,
        background: "rgba(19, 20, 20, 0.25)",
      }}
    />
  );

  return (
    <div
      role="toolbar"
      aria-label="Home options"
      style={{
        ...PANEL,
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        // as wide as its controls, centred, but never past the screen's
        // 16px margins
        width: "max-content",
        maxWidth: "calc(100% - 32px)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        // The ends are as far from the view toggle as its top and bottom
        // are, since the captioned swatches make the dock taller than it
        padding: isMobile ? "5px 8px" : "5px 10px",
        borderRadius: 999,
      }}
    >
      <ToggleButtonGroup
        exclusive
        aria-label="View"
        value={isInside ? "inside" : "outside"}
        onChange={(_, value) => value && onViewChange(value === "inside")}
        sx={{
          flexShrink: 0,
          gap: "2px",
          padding: "2px",
          borderRadius: 999,
          background: "rgba(19, 20, 20, 0.06)",
        }}
      >
        {view("outside", "Outside", <IconSun size={20} aria-hidden />)}
        {view("inside", "Inside", <IconDoor size={20} aria-hidden />)}
      </ToggleButtonGroup>

      {divider(4 + (target - dot) / 2)}

      <div
        role="group"
        aria-label={label}
        style={{
          display: "flex",
          alignItems: "center",
          // 20px between the circles either way, as desktop's tap
          // targets are bigger
          gap: isMobile ? 8 : 6,
          minWidth: 0,
        }}
      >
        {children}
      </div>

      {aside && (
        <>
          {divider()}
          {aside}
        </>
      )}
    </div>
  );
};

export default ControlDock;
