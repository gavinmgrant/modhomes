import React, {
  ReactNode,
  RefObject,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Canvas,
  createPortal,
  useFrame,
  useThree,
} from "@react-three/fiber";
import { Environment } from "@react-three/drei";
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

interface PreviewViewProps {
  track: RefObject<HTMLElement>;
  index: number;
  children: ReactNode;
}

// How far beyond the screen a preview keeps drawing, so one scrolled in
// before the next frame is already there
const OFFSCREEN_MARGIN = 0.5;

// Draws its children into the part of the canvas under its tracked element.
// Like drei's <View>, but positioned against the canvas rather than the
// screen, so it holds still while the page and canvas scroll together
const PreviewView = ({ track, index, children }: PreviewViewProps) => {
  const root = useThree((state) => state.scene);
  const [scene] = useState(() => root.clone(false));
  const [size, setSize] = useState<{
    width: number;
    height: number;
    top: number;
    left: number;
  }>();

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setSize({
        width: element.offsetWidth,
        height: element.offsetHeight,
        top: 0,
        left: 0,
      })
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [track]);

  if (!size) return null;
  return createPortal(
    <PreviewViewport track={track} index={index}>
      {children}
    </PreviewViewport>,
    scene,
    { size }
  );
};

const PreviewViewport = ({ track, index, children }: PreviewViewProps) => {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);

  useFrame(({ gl }) => {
    if (!track.current) return;
    const box = track.current.getBoundingClientRect();
    const margin = window.innerHeight * OFFSCREEN_MARGIN;
    if (box.bottom < -margin || box.top > window.innerHeight + margin) return;

    // Both rects move together on scroll, so the difference stays put even
    // when this frame lands after the browser has already scrolled the page
    const canvas = gl.domElement.getBoundingClientRect();
    const left = box.left - canvas.left;
    const bottom = canvas.bottom - box.bottom;
    const aspect = box.width / box.height;
    if (camera.aspect !== aspect) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
    gl.setViewport(left, bottom, box.width, box.height);
    gl.setScissor(left, bottom, box.width, box.height);
    gl.setScissorTest(true);
    gl.render(scene, camera);
  }, index);

  return <>{children}</>;
};

// Keeps the canvas's drawing buffer within what the GPU can draw into; on a
// phone the cards stack into a canvas a few thousand pixels tall
const FitResolution = () => {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const setDpr = useThree((state) => state.setDpr);

  useEffect(() => {
    const context = gl.getContext();
    const [maxWidth, maxHeight] = context.getParameter(
      context.MAX_VIEWPORT_DIMS
    );
    const maxSide = Math.min(
      maxWidth,
      maxHeight,
      context.getParameter(context.MAX_RENDERBUFFER_SIZE)
    );
    setDpr(
      Math.min(
        window.devicePixelRatio,
        2,
        maxSide / size.width,
        maxSide / size.height
      )
    );
  }, [gl, size.width, size.height, setDpr]);

  return null;
};

interface ModelPreviewsProps {
  slugs: string[];
  tracks: RefObject<HTMLElement>[];
  shown: string[];
  hovered: string | null;
}

// One transparent canvas laid over the cards draws every preview into its
// card's placeholder, rather than a WebGL context per card. It sits in the
// page rather than fixed to the screen, so it scrolls with the cards; a fixed
// canvas trails a phone's scrolling by a frame and the models shake
const ModelPreviews = ({
  slugs,
  tracks,
  shown,
  hovered,
}: ModelPreviewsProps) => (
  <Canvas
    // Nothing here depends on where the canvas sits on screen
    resize={{ scroll: false }}
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1,
    }}
  >
    <FitResolution />
    {slugs.map((slug, index) => (
      <PreviewView key={slug} index={index + 1} track={tracks[index]}>
        <Suspense fallback={null}>
          <ModelPreview
            slug={slug}
            visible={shown.includes(slug)}
            spinning={hovered === slug}
          />
        </Suspense>
      </PreviewView>
    ))}
  </Canvas>
);

export default ModelPreviews;
