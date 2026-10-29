// Shared frosted-glass look for the controls that float over the 3D view
export const INK = "#131414";
export const PAPER = "#f9f7f1";

export const PANEL = {
  background: "rgba(249, 247, 241, 0.78)",
  backdropFilter: "blur(12px) saturate(140%)",
  WebkitBackdropFilter: "blur(12px) saturate(140%)",
  border: "1px solid rgba(19, 20, 20, 0.12)",
  boxShadow: "0 4px 16px rgba(19, 20, 20, 0.08)",
  color: INK,
};

export const FOCUS_RING = {
  "&.Mui-focusVisible": {
    outline: `2px solid ${INK}`,
    outlineOffset: 2,
  },
};
