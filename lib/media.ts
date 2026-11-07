import { useMediaQuery } from "@mui/material";

// Below this width the navbar, dock and model card take their compact,
// phone-sized layouts
export const MOBILE_QUERY = "(max-width:900px)";

export const useIsMobile = () => useMediaQuery(MOBILE_QUERY);

// A touch screen, where the inside view walks by joystick instead of keys
export const useIsTouch = () => useMediaQuery("(pointer: coarse)");

// Whether the viewer has asked for less motion, read when an animation starts
// rather than kept in state, since it's only checked from frame loops
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
