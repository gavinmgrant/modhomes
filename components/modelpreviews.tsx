import React, {
  RefObject,
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, View } from "@react-three/drei";
import HomeModel, { getModelSize, parseModel } from "./homemodel";
import { COLORS } from "./colors";
import { CITY_ENVIRONMENT } from "./materials";

const FOV = 30;
// Camera sits 45° round from the front and a little above the horizon
const AZIMUTH = Math.PI / 4;
const ELEVATION = 0.32;
const SPIN_SPEED = 0.5;
// How quickly a preview turns back to its starting angle after hover ends
const RETURN_RATE = 6;

// One frame of easing back to the starting angle, the short way round:
// a model turned 90° unwinds, one turned 300° finishes the last 60°
export const easeToStart = (angle: number, delta: number) => {
  const offset = Math.atan2(Math.sin(angle), Math.cos(angle));
  const next = offset * Math.exp(-RETURN_RATE * delta);
  return Math.abs(next) < 0.001 ? 0 : next;
};

// How much of the frame the model may fill at its widest moment
const FRAME_FILL = 0.88;
const TURN_STEPS = 90;

// Largest distance from the centre of the frame, as a share of the half-frame,
// that any corner of the model's box reaches during a full turn
export const getFrameReach = (
  cols: number,
  stories: number,
  aspect: number,
  distance: number
) => {
  const { width, depth, height } = getModelSize(cols, stories);
  const tanV = Math.tan((FOV / 2) * (Math.PI / 180));
  const tanH = tanV * aspect;

  // Camera basis: `back` points from the model to the camera
  const back = [
    Math.cos(ELEVATION) * Math.sin(AZIMUTH),
    Math.sin(ELEVATION),
    Math.cos(ELEVATION) * Math.cos(AZIMUTH),
  ];
  const right = [back[2], 0, -back[0]];
  const rightLength = Math.hypot(right[0], right[2]);
  right[0] /= rightLength;
  right[2] /= rightLength;
  const up = [
    back[1] * right[2] - back[2] * right[1],
    back[2] * right[0] - back[0] * right[2],
    back[0] * right[1] - back[1] * right[0],
  ];
  const dot = (a: number[], b: number[]) =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  let reach = 0;
  for (let step = 0; step < TURN_STEPS; step++) {
    const turn = (step / TURN_STEPS) * 2 * Math.PI;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const x = (sx * width) / 2;
          const z = (sz * depth) / 2;
          const corner = [
            x * Math.cos(turn) + z * Math.sin(turn) - distance * back[0],
            (sy * height) / 2 - distance * back[1],
            -x * Math.sin(turn) + z * Math.cos(turn) - distance * back[2],
          ];
          const ahead = -dot(corner, back);
          reach = Math.max(
            reach,
            Math.abs(dot(corner, right)) / (ahead * tanH),
            Math.abs(dot(corner, up)) / (ahead * tanV)
          );
        }
      }
    }
  }
  return reach;
};

// Closest camera distance that keeps every corner of the model in frame,
// with a margin, however far it has turned
export const getPreviewDistance = (
  cols: number,
  stories: number,
  aspect: number
) => {
  const { width, depth, height } = getModelSize(cols, stories);
  let near = Math.hypot(width, depth, height) / 2;
  let far = near * 10;
  for (let i = 0; i < 30; i++) {
    const middle = (near + far) / 2;
    if (getFrameReach(cols, stories, aspect, middle) > FRAME_FILL) {
      near = middle;
    } else {
      far = middle;
    }
  }
  return far;
};

interface ModelPreviewProps {
  slug: string;
  visible: boolean;
  spinning: boolean;
}

const ModelPreview = ({ slug, visible, spinning }: ModelPreviewProps) => {
  // three has no type definitions installed here, so these refs are untyped
  const group = useRef<any>(null);
  const camera = useRef<any>(null);
  const size = useThree((state) => state.size);
  const set = useThree((state) => state.set);
  const layout = parseModel(slug);

  // Give this view its own camera instead of the canvas's shared one
  useLayoutEffect(() => {
    if (camera.current) set({ camera: camera.current });
  }, [set]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const rotation = group.current.rotation;
    if (spinning) {
      rotation.y += delta * SPIN_SPEED;
    } else if (rotation.y !== 0) {
      rotation.y = easeToStart(rotation.y, delta);
    }
  });

  const cols = layout?.cols ?? 1;
  const stories = layout?.stories ?? 1;
  const aspect = size.width / size.height;
  const distance = useMemo(
    () => getPreviewDistance(cols, stories, aspect),
    [cols, stories, aspect]
  );

  if (!layout) return null;
  const { centerY } = getModelSize(cols, stories);

  return (
    <>
      <perspectiveCamera
        ref={camera}
        fov={FOV}
        position={[
          distance * Math.cos(ELEVATION) * Math.sin(AZIMUTH),
          centerY + distance * Math.sin(ELEVATION),
          distance * Math.cos(ELEVATION) * Math.cos(AZIMUTH),
        ]}
        onUpdate={(self: any) => self.lookAt(0, centerY, 0)}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[40, 60, 30]} intensity={0.8} />
      <Environment files={CITY_ENVIRONMENT} />
      <group ref={group} visible={visible}>
        <HomeModel
          cols={layout.cols}
          stories={layout.stories}
          color={COLORS.white}
          floorMaterial="walnut"
        />
      </group>
    </>
  );
};

interface ModelPreviewsProps {
  slugs: string[];
  tracks: RefObject<HTMLElement>[];
  shown: string[];
  hovered: string | null;
}

// One transparent canvas over the page draws every preview into its card's
// placeholder, rather than a WebGL context per card
const ModelPreviews = ({
  slugs,
  tracks,
  shown,
  hovered,
}: ModelPreviewsProps) => (
  <Canvas
    style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1,
    }}
  >
    {slugs.map((slug, index) => (
      <View
        key={slug}
        index={index + 1}
        track={tracks[index] as React.MutableRefObject<HTMLElement>}
      >
        <Suspense fallback={null}>
          <ModelPreview
            slug={slug}
            visible={shown.includes(slug)}
            spinning={hovered === slug}
          />
        </Suspense>
      </View>
    ))}
  </Canvas>
);

export default ModelPreviews;
