import React, { forwardRef, HTMLAttributes, ReactNode } from "react";
import { ButtonBase, CircularProgress, Tooltip } from "@mui/material";
import { FOCUS_RING, INK, PAPER } from "./panel";
import { getSwatchSize } from "./swatch";
import { useIsMobile } from "../lib/media";

interface CaptionedProps extends HTMLAttributes<HTMLDivElement> {
  caption: string;
  // Hidden from screen readers when the control's own label says it all
  captionHidden?: boolean;
}

// A dock control with a small caption under it, so each one is only as wide
// as its circle. The caption comes first for screen readers but shows
// underneath, tucked up into the space under the circle
export const Captioned = forwardRef<HTMLDivElement, CaptionedProps>(
  ({ caption, captionHidden, children, style, ...rest }, ref) => (
    <div
      ref={ref}
      style={{
        display: "flex",
        flexDirection: "column-reverse",
        alignItems: "center",
        gap: 2,
        ...style,
      }}
      {...rest}
    >
      <span
        aria-hidden={captionHidden || undefined}
        style={{ fontSize: 11, lineHeight: 1.2, opacity: 0.6, marginTop: -6 }}
      >
        {caption}
      </span>
      {children}
    </div>
  ),
);

Captioned.displayName = "Captioned";

interface DockToggleProps {
  caption: string;
  // The button's accessible name, which stays the same whether it's on or off
  label: string;
  // The tooltip, which says what a click will do
  title: string;
  on: boolean;
  onClick: () => void;
  icon: ReactNode;
  // Set for a toggle that can be switched off for good, like the site's
  disabled?: boolean;
  // Swaps the icon for a spinner while what it turned on is on its way
  busy?: boolean;
}

// A round, captioned switch in the dock, filled in while it's on
const DockToggle = ({
  caption,
  label,
  title,
  on,
  onClick,
  icon,
  disabled,
  busy = false,
}: DockToggleProps) => {
  const { target, dot } = getSwatchSize(useIsMobile());

  const button = (
    <ButtonBase
      aria-label={label}
      aria-pressed={on}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: target,
        height: target,
        flexShrink: 0,
        borderRadius: "50%",
        opacity: disabled ? 0.4 : 1,
        ...FOCUS_RING,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: dot,
          height: dot,
          borderRadius: "50%",
          background: on ? INK : "transparent",
          color: on ? PAPER : INK,
          boxShadow: "inset 0 0 0 1px rgba(19, 20, 20, 0.25)",
          transition: "background 150ms ease-out, color 150ms ease-out",
        }}
      >
        {busy ? (
          <CircularProgress size={16} thickness={5} color="inherit" />
        ) : (
          icon
        )}
      </span>
    </ButtonBase>
  );

  return (
    <Captioned caption={caption} captionHidden>
      <Tooltip title={title}>
        {disabled === undefined ? (
          button
        ) : (
          // A span so the tooltip still shows when the button is disabled
          <span style={{ display: "inline-flex" }}>{button}</span>
        )}
      </Tooltip>
    </Captioned>
  );
};

export default DockToggle;
