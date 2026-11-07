// Shared frosted-glass look for the controls that float over the 3D view
export const INK = "#131414";
export const PAPER = "#f9f7f1";
// INK and PAPER, see-through: ink(0.12) is "rgba(19, 20, 20, 0.12)"
export const ink = (alpha: number) => `rgba(19, 20, 20, ${alpha})`;
export const paper = (alpha: number) => `rgba(249, 247, 241, ${alpha})`;
// Corner radius shared by the navbar and the model card under it
export const PANEL_RADIUS = 18;

export const PANEL = {
  background: paper(0.78),
  backdropFilter: "blur(12px) saturate(140%)",
  WebkitBackdropFilter: "blur(12px) saturate(140%)",
  border: `1px solid ${ink(0.12)}`,
  boxShadow: `0 4px 16px ${ink(0.08)}`,
  color: INK,
};

export const FOCUS_RING = {
  "&.Mui-focusVisible": {
    outline: `2px solid ${INK}`,
    outlineOffset: 2,
  },
};
