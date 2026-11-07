import React, { ReactNode } from "react";
import { CircularProgress } from "@mui/material";
import { PANEL } from "./panel";

interface ViewNoticeProps {
  // Spins while what it's about is on its way
  loading?: boolean;
  children: ReactNode;
}

// Word over the middle of a 3D view, from something drawn in it that's
// still loading or couldn't be had: the site's tiles outside, the landscape
// through the glass inside. Placed within the view's positioned wrapper,
// before its canvas
const ViewNotice = ({ loading = false, children }: ViewNoticeProps) => (
  <div
    role="status"
    aria-live="polite"
    style={{
      ...PANEL,
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      // Over the canvas, which is positioned and comes after it
      zIndex: 1,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 16px",
      borderRadius: 999,
      fontSize: 14,
      whiteSpace: "nowrap",
      pointerEvents: "none",
    }}
  >
    {loading && <CircularProgress size={16} thickness={5} color="inherit" />}
    {children}
  </div>
);

export default ViewNotice;
