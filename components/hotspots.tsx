import React, {
  MutableRefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { ButtonBase, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { IconExternalLink, IconInfoSmall, IconX } from "@tabler/icons-react";
import { FOCUS_RING, INK, PANEL, PAPER } from "./panel";
import { getSwatchSize } from "./swatch";
import type { Facing } from "./fixtures";
import type { Spot } from "./kitchen";
import { Appliance, ApplianceId, APPLIANCES } from "../lib/appliances";
import { loadHotspotsSeen, saveHotspotsSeen } from "../lib/hotspotsseen";

// Units are feet. A dot shows in full within `near` of the camera and fades
// out by `far`, so the kitchen isn't dotted from the far end of the home
export const SPOT_RANGE = { near: 20, far: 28 };

const NORMALS: Record<Facing, [number, number]> = {
  "+x": [1, 0],
  "-x": [-1, 0],
  "+z": [0, 1],
  "-z": [0, -1],
};

const ramp = (value: number, from: number, to: number) =>
  Math.min(Math.max((value - from) / (to - from), 0), 1);

// How opaque a spot's dot is, seen from the camera at (x, z): it shows only
// from in front of its appliance, which keeps it from showing through the
// walls behind, fading out as the view turns side on and with distance
export const getSpotOpacity = (
  { position: [x, , z], facing }: Spot,
  [cx, cz]: [number, number],
) => {
  const [dx, dz] = [cx - x, cz - z];
  const distance = Math.hypot(dx, dz) || 1;
  const [nx, nz] = NORMALS[facing];
  // 1 looking straight at its front, 0 side on, less from behind
  const square = (dx * nx + dz * nz) / distance;
  return (
    ramp(square, 0.1, 0.3) * ramp(distance, SPOT_RANGE.far, SPOT_RANGE.near)
  );
};

// Walking this far, in feet, closes an open card. Looking around moves the
// camera a hair too, as it orbits a point just in front of it
const WALKED = 0.25;
// The card's gap from its dot, and how far it keeps from the screen's edges,
// the navbar and info chip above and the dock below, in px
const GAP = 8;
const CLEAR = { top: 136, bottom: 96, side: 16 };
const CARD_WIDTH = 264;
const RISE = 8;

interface ApplianceCardProps {
  id: string;
  appliance: Appliance;
  onClose: () => void;
}

// The details of one appliance, over its dot, or under it when there's no
// room above. It's nudged sideways to stay on screen
export const ApplianceCard = ({
  id,
  appliance,
  onClose,
}: ApplianceCardProps) => {
  const { kind, standard: product } = appliance;
  const card = useRef<HTMLDivElement>(null);
  const [placing, setPlacing] = useState({ below: false, shift: 0 });
  const still = useReducedMotion();
  const titleId = `${id}-title`;

  useLayoutEffect(() => {
    if (!card.current) return;
    const { top, left, right } = card.current.getBoundingClientRect();
    const width = window.innerWidth;
    setPlacing({
      below: top < CLEAR.top,
      shift:
        left < CLEAR.side
          ? CLEAR.side - left
          : right > width - CLEAR.side
            ? width - CLEAR.side - right
            : 0,
    });
  }, []);

  const rise = still ? 0 : placing.below ? -RISE : RISE;

  return (
    <motion.div
      ref={card}
      id={id}
      role="dialog"
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: rise }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        ...PANEL,
        background: "rgba(249, 247, 241, 0.94)",
        position: "absolute",
        left: `calc(50% + ${placing.shift}px)`,
        x: "-50%",
        ...(placing.below
          ? { top: `calc(100% + ${GAP}px)` }
          : { bottom: `calc(100% + ${GAP}px)` }),
        width: `min(${CARD_WIDTH}px, calc(100vw - ${2 * CLEAR.side}px))`,
        padding: "12px 14px 14px",
        borderRadius: 16,
        textAlign: "left",
        cursor: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
          paddingRight: 28,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          {kind}
        </span>
        <span
          style={{
            fontSize: 11,
            lineHeight: "18px",
            padding: "0 8px",
            borderRadius: 999,
            background: "rgba(19, 20, 20, 0.08)",
          }}
        >
          Standard
        </span>
      </div>
      <IconButton
        aria-label="Close"
        size="small"
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          color: INK,
          ...FOCUS_RING,
        }}
      >
        <IconX size={16} aria-hidden />
      </IconButton>
      <div id={titleId} style={{ fontSize: 15, fontWeight: 600 }}>
        {product.brand} {product.series}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.35 }}>{product.name}</div>
      <div style={{ fontSize: 12, marginTop: 2, opacity: 0.6 }}>
        Model {product.model}
      </div>
      <ul
        style={{
          margin: "10px 0 12px",
          paddingLeft: 18,
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {product.specs.map((spec) => (
          <li key={spec}>{spec}</li>
        ))}
      </ul>
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        View at {product.brand}
        <IconExternalLink size={14} aria-hidden />
      </a>
    </motion.div>
  );
};

interface HotspotProps {
  spot: Spot;
  isOpen: boolean;
  pulse: boolean;
  dot: (el: HTMLDivElement | null) => void;
  onToggle: () => void;
  onClose: () => void;
}

// A dot on an appliance, with a 44px tap target around it, that opens its card
const Hotspot = ({
  spot,
  isOpen,
  pulse,
  dot,
  onToggle,
  onClose,
}: HotspotProps) => {
  const appliance = APPLIANCES[spot.appliance];
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  const close = () => {
    onClose();
    button.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <Html position={spot.position} center zIndexRange={[2, 0]}>
      {/* The canvas listens for clicks around this, to close the card when
          one lands on the view, so they're kept from reaching it */}
      <div
        style={{ position: "relative" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div ref={dot} style={{ opacity: 0, visibility: "hidden" }}>
          <Tooltip title={isOpen ? "" : appliance.kind} placement="right">
            <ButtonBase
              ref={button}
              aria-label={`${appliance.kind} specs`}
              aria-expanded={isOpen}
              aria-controls={isOpen ? id : undefined}
              onClick={onToggle}
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                "&:hover .hotspot-dot": { transform: "scale(1.15)" },
                ...FOCUS_RING,
              }}
            >
              <span
                className={pulse ? "hotspot-dot hotspot-pulse" : "hotspot-dot"}
                style={{
                  position: "relative",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: isOpen
                    ? INK
                    : `radial-gradient(circle, ${INK} 0 2.5px, ${PAPER} 3px)`,
                  boxShadow: isOpen
                    ? `0 0 0 2px ${PAPER}, 0 0 0 3px ${INK}`
                    : "0 0 0 1px rgba(19, 20, 20, 0.35), 0 2px 8px rgba(19, 20, 20, 0.35)",
                  transition: "transform 150ms ease-out",
                }}
              />
            </ButtonBase>
          </Tooltip>
        </div>
        {isOpen && (
          <ApplianceCard id={id} appliance={appliance} onClose={close} />
        )}
      </div>
    </Html>
  );
};

interface ApplianceHotspotsProps {
  spots: Spot[];
  open: ApplianceId | null;
  onOpen: (appliance: ApplianceId | null) => void;
}

// The appliance dots in the inside view. They pulse until one's been opened.
// One card shows at a time, the other dots giving way to it, and it closes
// on walking, or when its dot leaves the screen
const ApplianceHotspots = ({ spots, open, onOpen }: ApplianceHotspotsProps) => {
  const camera = useThree((state) => state.camera);
  const dots = useRef<Partial<Record<ApplianceId, HTMLDivElement | null>>>({});
  const openedAt: MutableRefObject<[number, number]> = useRef([0, 0]);
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    setSeen(loadHotspotsSeen());
  }, []);

  useEffect(() => {
    if (open) openedAt.current = [camera.position.x, camera.position.z];
  }, [camera, open]);

  useFrame(() => {
    const { x, z } = camera.position;
    spots.forEach((spot) => {
      const el = dots.current[spot.appliance];
      if (!el) return;
      const isOpen = spot.appliance === open;
      const opacity =
        open && !isOpen ? 0 : isOpen ? 1 : getSpotOpacity(spot, [x, z]);
      el.style.opacity = `${opacity}`;
      el.style.visibility = opacity > 0.05 ? "visible" : "hidden";
      if (!isOpen) return;
      const [ox, oz] = openedAt.current;
      const rect = el.getBoundingClientRect();
      const middle = [rect.left + rect.width / 2, rect.top + rect.height / 2];
      const offScreen =
        !rect.width ||
        middle[0] < 0 ||
        middle[0] > window.innerWidth ||
        middle[1] < 0 ||
        middle[1] > window.innerHeight;
      if (Math.hypot(x - ox, z - oz) > WALKED || offScreen) onOpen(null);
    });
  });

  return (
    <>
      {spots.map((spot) => (
        <Hotspot
          key={spot.appliance}
          spot={spot}
          isOpen={spot.appliance === open}
          pulse={!seen && !open}
          dot={(el) => {
            dots.current[spot.appliance] = el;
          }}
          onToggle={() => {
            if (!seen) {
              setSeen(true);
              saveHotspotsSeen();
            }
            onOpen(spot.appliance === open ? null : spot.appliance);
          }}
          onClose={() => onOpen(null)}
        />
      ))}
    </>
  );
};

export default ApplianceHotspots;

interface SpecsToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
}

// The dock's switch for the spec dots, captioned like its swatches
export const SpecsToggle = ({ on, onChange }: SpecsToggleProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const { target, dot: circle } = getSwatchSize(isMobile);
  const name = on ? "Hide product specs" : "Show product specs";

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
        Specs
      </span>
      <Tooltip title={name}>
        <ButtonBase
          aria-label="Product specs"
          aria-pressed={on}
          onClick={() => onChange(!on)}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: circle,
              height: circle,
              borderRadius: "50%",
              background: on ? INK : "transparent",
              color: on ? PAPER : INK,
              boxShadow: "inset 0 0 0 1px rgba(19, 20, 20, 0.25)",
              transition: "background 150ms ease-out, color 150ms ease-out",
            }}
          >
            <IconInfoSmall size={26} aria-hidden />
          </span>
        </ButtonBase>
      </Tooltip>
    </div>
  );
};
