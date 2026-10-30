import React, { ReactNode } from "react";
import { ToggleButton, ToggleButtonGroup, useMediaQuery } from "@mui/material";
import { IconSun, IconDoor } from "@tabler/icons-react";
import { FOCUS_RING, INK, PANEL, PAPER } from "./panel";

interface ControlDockProps {
  isInside: boolean;
  onViewChange: (inside: boolean) => void;
  label: string;
  children: ReactNode;
}

const ControlDock = ({
  isInside,
  onViewChange,
  label,
  children,
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

  return (
    <div
      role="toolbar"
      aria-label="Home options"
      style={{
        ...PANEL,
        position: "absolute",
        bottom: 16,
        left: isMobile ? 16 : "50%",
        right: isMobile ? 16 : "auto",
        transform: isMobile ? "none" : "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px",
        paddingRight: isMobile ? "5px" : "8px",
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

      <div
        style={{
          width: 1,
          height: 24,
          flexShrink: 0,
          // tighter on phones so the swatches still fit at 320px
          margin: isMobile ? "0 4px" : "0 10px",
          background: "rgba(19, 20, 20, 0.25)",
        }}
      />

      <div
        role="group"
        aria-label={label}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "space-evenly" : "flex-start",
          flex: isMobile ? 1 : "none",
          gap: isMobile ? 4 : 12,
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ControlDock;
