import React, { useEffect, useState, useSyncExternalStore } from "react";
import {
  ButtonBase,
  CircularProgress,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { IconMapPin } from "@tabler/icons-react";
import { FOCUS_RING, INK, PANEL, PAPER } from "./panel";
import { getSwatchSize } from "./swatch";
import { formatCoordinates, SITE, SiteLocation } from "../lib/site";

// The Site view's controls and word from it: the dock's switch, the address
// naming the lot, and the notice while it loads. The tiles themselves are
// drawn in the outside canvas, by `SiteTiles`

// "loading" from when the tiles are first asked for until the home has been
// settled onto their ground, then "ready", or "failed" if the key is
// refused, the API isn't enabled, or the day's quota is spent. Failing is
// final for the page: the view goes back to the sky, and the switch stays
// off
export type SiteStatus = "off" | "loading" | "ready" | "failed";

let status: SiteStatus = "off";
const listeners = new Set<() => void>();

export const setSiteStatus = (next: SiteStatus) => {
  // Failing is final, and a late answer doesn't undo it
  if (status === "failed" || status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getStatus = () => status;

export const useSiteStatus = () =>
  useSyncExternalStore(subscribe, getStatus, getStatus);

interface SiteToggleProps {
  on: boolean;
  status: SiteStatus;
  onChange: (on: boolean) => void;
}

// The dock's switch for the site, captioned like its swatches
export const SiteToggle = ({ on, status, onChange }: SiteToggleProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const { target, dot: circle } = getSwatchSize(isMobile);
  const failed = status === "failed";
  const loading = on && status === "loading";
  const name = failed
    ? "The site map isn't available right now"
    : loading
    ? "Loading the site…"
    : on
    ? "Take the home off its site"
    : "Show the home on its site";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column-reverse",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span
        aria-hidden
        style={{ fontSize: 11, lineHeight: 1.2, opacity: 0.6, marginTop: -6 }}
      >
        Site
      </span>
      <Tooltip title={name}>
        {/* A span so the tooltip still shows when the button is disabled */}
        <span style={{ display: "inline-flex" }}>
          <ButtonBase
            aria-label="Home on its site"
            aria-pressed={on && !failed}
            aria-busy={loading}
            disabled={failed}
            onClick={() => onChange(!on)}
            sx={{
              width: target,
              height: target,
              flexShrink: 0,
              borderRadius: "50%",
              opacity: failed ? 0.4 : 1,
              ...FOCUS_RING,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: circle,
                height: circle,
                borderRadius: "50%",
                background: on && !failed ? INK : "transparent",
                color: on && !failed ? PAPER : INK,
                boxShadow: "inset 0 0 0 1px rgba(19, 20, 20, 0.25)",
                transition: "background 150ms ease-out, color 150ms ease-out",
              }}
            >
              {loading ? (
                <CircularProgress size={16} thickness={5} color="inherit" />
              ) : (
                <IconMapPin size={18} aria-hidden />
              )}
            </span>
          </ButtonBase>
        </span>
      </Tooltip>
    </div>
  );
};

interface SiteAddressProps {
  // Whether the site is in view, which is when there's a lot to name
  shown: boolean;
  site?: SiteLocation;
}

// Where the home stands, in the middle of the header while the site shows:
// the lot's name, and its coordinates under it in a caption's style.
// Read-only for now; one day it opens the way to another lot
export const SiteAddress = ({ shown, site = SITE }: SiteAddressProps) => (
  <AnimatePresence>
    {shown && (
      <motion.section
        aria-label="Site"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          whiteSpace: "nowrap",
        }}
      >
        <IconMapPin size={20} aria-hidden style={{ flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column-reverse" }}>
          <span style={{ fontSize: 12, lineHeight: 1.3, opacity: 0.6 }}>
            {formatCoordinates(site.lat, site.lng)}
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
            {site.label}
          </span>
        </div>
      </motion.section>
    )}
  </AnimatePresence>
);

// How long the failure notice stays up
const NOTICE_MS = 5000;

interface SiteNoticeProps {
  status: SiteStatus;
  // Whether the site is wanted and in view, so a notice would be read
  shown: boolean;
}

// Word from the site, over the middle of the view, like the inside view's
// loader: that it's on its way, since the tiles are hidden until the home
// stands on them, or, for a few seconds, that they couldn't be had
export const SiteNotice = ({ status, shown }: SiteNoticeProps) => {
  const [failedRecently, setFailedRecently] = useState(false);
  useEffect(() => {
    if (status !== "failed") return;
    setFailedRecently(true);
    const timer = window.setTimeout(() => setFailedRecently(false), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  const loading = shown && status === "loading";
  const failed = shown && failedRecently;
  if (!loading && !failed) return null;

  return (
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
      {loading ? "Loading the site…" : "The site map isn't available right now"}
    </div>
  );
};
