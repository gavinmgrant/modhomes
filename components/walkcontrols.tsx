import React, {
  ElementRef,
  MutableRefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { IconButton } from "@mui/material";
import {
  IconChevronUp,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { FOCUS_RING, INK, PANEL } from "./panel";
import { getStairLayout, Rect } from "./stair";

export type WalkInput = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  // analog joystick, each -1 to 1
  stickX: number;
  stickY: number;
};

type WalkKey = "forward" | "back" | "left" | "right";

export const IDLE_INPUT: WalkInput = {
  forward: false,
  back: false,
  left: false,
  right: false,
  stickX: 0,
  stickY: 0,
};

export type WalkBounds = {
  maxX: number;
  maxZ: number;
  // x centres of the column pairs where two modules meet (at z = 0)
  columns: number[];
  // Solid footprints to walk around, like the stair
  blocks: Rect[];
};

const SPEED = 7;
const BODY_RADIUS = 0.6;
const COLUMN_HALF_WIDTH = 0.625;
const COLUMN_HALF_DEPTH = 0.25;

const clamp = (value: number, max: number) =>
  Math.min(Math.max(value, -max), max);

// Each module is 8 wide (x) and 40 deep (z), laid side by side and centred on 0
export const getWalkBounds = (modulesWide: number, stories = 1): WalkBounds => {
  const halfWidth = 4 * modulesWide;
  const columns = [];
  for (let i = 1; i < modulesWide; i++) {
    columns.push(-halfWidth + 8 * i);
  }
  const blocks = stories === 2 ? [getStairLayout(modulesWide).opening] : [];
  return { maxX: halfWidth - 1, maxZ: 18.5, columns, blocks };
};

const isBlocked = (bounds: WalkBounds, x: number, z: number) =>
  (Math.abs(z) < COLUMN_HALF_DEPTH + BODY_RADIUS &&
    bounds.columns.some(
      (cx) => Math.abs(x - cx) < COLUMN_HALF_WIDTH + BODY_RADIUS
    )) ||
  bounds.blocks.some(
    (block) =>
      x > block.x[0] - BODY_RADIUS &&
      x < block.x[1] + BODY_RADIUS &&
      z > block.z[0] - BODY_RADIUS &&
      z < block.z[1] + BODY_RADIUS
  );

// Move one axis at a time so walking into a wall or column slides along it
export const stepWithin = (
  bounds: WalkBounds,
  x: number,
  z: number,
  dx: number,
  dz: number
) => {
  const nextX = clamp(x + dx, bounds.maxX);
  if (!isBlocked(bounds, nextX, z)) x = nextX;
  const nextZ = clamp(z + dz, bounds.maxZ);
  if (!isBlocked(bounds, x, nextZ)) z = nextZ;
  return { x, z };
};

const KEYS: Record<string, WalkKey> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

interface WalkControlsProps {
  bounds: WalkBounds;
  input: MutableRefObject<WalkInput>;
}

const WalkControls = ({ bounds, input }: WalkControlsProps) => {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const camera = useThree((state) => state.camera);

  // Orbit around a point just in front of the camera so dragging looks around.
  // A layout effect, so it runs before the first frame: one update against the
  // default target at the origin would snap the camera down to y = 0
  useLayoutEffect(() => {
    const { x, y, z } = camera.position;
    controls.current?.target.set(x, y, z - 0.01);
    controls.current?.update();
  }, [camera]);

  useEffect(() => {
    const handleKey = (pressed: boolean) => (event: KeyboardEvent) => {
      const direction = KEYS[event.code];
      if (!direction) return;
      event.preventDefault();
      input.current[direction] = pressed;
    };
    const handleDown = handleKey(true);
    const handleUp = handleKey(false);
    const handleBlur = () => {
      input.current = { ...IDLE_INPUT };
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [input]);

  useFrame((_, delta) => {
    const { forward: f, back, left, right, stickX, stickY } = input.current;
    const ahead = clamp(Number(f) - Number(back) + stickY, 1);
    const across = clamp(Number(right) - Number(left) + stickX, 1);
    if (!controls.current || (!ahead && !across)) return;

    // The camera always faces its orbit target, so that gives the walk direction
    const { target } = controls.current;
    const facingX = target.x - camera.position.x;
    const facingZ = target.z - camera.position.z;
    const length = Math.hypot(facingX, facingZ) || 1;

    // Cap the step so a dropped frame doesn't teleport through a column
    const distance = (SPEED * Math.min(delta, 0.1)) / length;
    const dx = (facingX * ahead - facingZ * across) * distance;
    const dz = (facingZ * ahead + facingX * across) * distance;
    const { x, z } = stepWithin(
      bounds,
      camera.position.x,
      camera.position.z,
      dx,
      dz
    );

    controls.current.target.x += x - camera.position.x;
    controls.current.target.z += z - camera.position.z;
    camera.position.x = x;
    camera.position.z = z;
    controls.current.update();
  });

  return (
    <OrbitControls
      ref={controls}
      minPolarAngle={Math.PI / 2}
      maxPolarAngle={Math.PI / 2}
      enableZoom={false}
      enablePan={false}
      rotateSpeed={-0.4}
    />
  );
};

interface WalkPadProps {
  input: MutableRefObject<WalkInput>;
}

// Desktop: small arrow keys plus a hint that fades once someone starts walking
export const WalkPad = ({ input }: WalkPadProps) => {
  const [hasWalked, setHasWalked] = useState(false);

  useEffect(() => {
    if (hasWalked) return;
    const handleKey = (event: KeyboardEvent) => {
      if (KEYS[event.code]) setHasWalked(true);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hasWalked]);

  const arrow = (
    direction: WalkKey,
    label: string,
    icon: React.ReactNode,
    column: number,
    row: number
  ) => {
    const hold = (pressed: boolean) => () => {
      input.current[direction] = pressed;
      if (pressed) setHasWalked(true);
    };

    return (
      <IconButton
        aria-label={label}
        onPointerDown={hold(true)}
        onPointerUp={hold(false)}
        onPointerLeave={hold(false)}
        onPointerCancel={hold(false)}
        onContextMenu={(event) => event.preventDefault()}
        sx={{
          ...PANEL,
          gridColumn: column,
          gridRow: row,
          width: 40,
          height: 40,
          borderRadius: "10px",
          userSelect: "none",
          "&:hover": { background: "rgba(249, 247, 241, 0.95)" },
          "&:active": { background: INK, color: "#f9f7f1" },
          ...FOCUS_RING,
        }}
      >
        {icon}
      </IconButton>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        bottom: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        aria-hidden={hasWalked}
        style={{
          ...PANEL,
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 13,
          opacity: hasWalked ? 0 : 1,
          transition: "opacity 600ms ease-out",
        }}
      >
        WASD or arrows to walk
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 40px)",
          gap: 6,
        }}
      >
        {arrow("forward", "Walk forward", <IconChevronUp size={20} />, 2, 1)}
        {arrow("left", "Step left", <IconChevronLeft size={20} />, 1, 2)}
        {arrow("back", "Walk back", <IconChevronDown size={20} />, 2, 2)}
        {arrow("right", "Step right", <IconChevronRight size={20} />, 3, 2)}
      </div>
    </div>
  );
};

const STICK_RADIUS = 36;
const STICK_DEADZONE = 0.15;

// Touch: drag the knob in any direction, further from centre walks faster
export const Joystick = ({ input }: WalkPadProps) => {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const move = (event: React.PointerEvent) => {
    if (!base.current) return;
    const rect = base.current.getBoundingClientRect();
    let x = event.clientX - (rect.left + rect.width / 2);
    let y = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(x, y);
    if (length > STICK_RADIUS) {
      x *= STICK_RADIUS / length;
      y *= STICK_RADIUS / length;
    }
    setKnob({ x, y });

    const live = Math.hypot(x, y) / STICK_RADIUS > STICK_DEADZONE;
    input.current.stickX = live ? x / STICK_RADIUS : 0;
    input.current.stickY = live ? -y / STICK_RADIUS : 0;
  };

  const release = () => {
    setKnob({ x: 0, y: 0 });
    input.current.stickX = 0;
    input.current.stickY = 0;
  };

  return (
    <div
      ref={base}
      role="group"
      aria-label="Walk joystick"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        ...PANEL,
        position: "absolute",
        right: 16,
        // clears the 52px dock below it
        bottom: 84,
        width: 104,
        height: 104,
        borderRadius: "50%",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: INK,
          opacity: 0.85,
          transform: `translate(${knob.x}px, ${knob.y}px)`,
          transition: knob.x || knob.y ? "none" : "transform 150ms ease-out",
        }}
      />
    </div>
  );
};

export default WalkControls;
