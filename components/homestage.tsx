import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AccumulativeShadows,
  Center,
  Environment,
  RandomizedLight,
  shaderMaterial,
} from "@react-three/drei";
import type { OnCenterCallbackProps } from "@react-three/drei";
import { Material, Mesh } from "three";
import { COLORS } from "./colors";
import { CITY_ENVIRONMENT } from "./materials";

// drei's Stage as the outside view used it: its "rembrandt" lights at 0.4
// intensity round the centred home, a city HDR, and a soft ground shadow
// built up from many randomized lights. Stage clears that shadow and builds
// it again on every render, so it went blank and faded back in whenever a
// deck came or went. Here it's built once and kept, and a moving deck is
// blended into it as it goes, leaving the rest of it in place
const INTENSITY = 0.4;
const MAIN = [1, 2, 1];
const FILL = [-2, -0.5, -2];
const SHADOW = { frames: 100, opacity: 0.3, alphaTest: 0.9 };

// Draws nothing, while what it's on still casts its shadow, like the
// material drei's shadow puts on the scene's meshes while it adds a pass
const DiscardMaterial = shaderMaterial(
  {},
  "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  "void main() { discard; }",
);

// What drei's shadow hands its ref, a type it doesn't export
type ShadowApi = React.ElementRef<typeof AccumulativeShadows>;

// Each pass blends a new frame into the ground shadow at 1 / SHADOW.frames.
// It's built with one pass a frame for SHADOW.frames frames, fading in as it
// goes. After that a moving deck gets two a frame, and once it settles they
// keep going until its old shadow has all but gone: 0.99 ^ (2 * 150) leaves
// 5% of it
export const SHADOW_REFRESH = { passes: 2, settleFrames: 150 };
// drei's default for how strongly the shadow takes its color
const COLOR_BLEND = 2;

// The shadow is built from a texture that starts black and has each pass
// blended into it, and stopping at SHADOW.frames passes leaves it short of
// fully lit: (1 - 0.99 ^ 100) = 63% of the way. That darkness is much of the
// shadow's look, so any passes after those are made up for, by how much
// lighter the texture has become since: this ratio, for the shadow's
// threshold and the strength of its color
export const getShadowExposure = (passes: number) => {
  const reached = (n: number) => 1 - Math.pow(1 - 1 / SHADOW.frames, n);
  return reached(Math.max(passes, SHADOW.frames)) / reached(SHADOW.frames);
};

export type StageSize = { radius: number; height: number };

interface HomeStageProps {
  children: ReactNode;
  // Whether anything in the home is moving, so the shadow should follow it
  moving?: boolean;
  // Told the home's size whenever it's measured, for anything outside the
  // stage that needs to know where its ground is
  onSized?: (size: StageSize) => void;
}

const HomeStage = ({ children, moving = false, onSized }: HomeStageProps) => {
  const [{ radius, height }, setSize] = useState({ radius: 0, height: 0 });
  // The latest callback, so a new one each render doesn't recentre the home
  const sized = useRef(onSized);
  sized.current = onSized;
  const onCentered = useCallback(
    ({ height, boundingSphere }: OnCenterCallbackProps) => {
      const size = { radius: boundingSphere.radius, height };
      setSize(size);
      sized.current?.(size);
    },
    [],
  );
  const shadow = useRef<ShadowApi>(null);
  const discard = useMemo(() => new DiscardMaterial(), []);
  // Passes blended into the shadow since it was last cleared, and frames
  // left to keep adding them
  const passes = useRef(0);
  const refresh = useRef(0);
  // The canvas only draws when asked, so the shadow asks for frames while
  // it has passes left to add
  const invalidate = useThree((state) => state.invalidate);

  // The shadow starts over when it's drawn again, once the home's size is
  // known
  useEffect(() => {
    passes.current = 0;
    refresh.current = SHADOW.frames;
    invalidate();
  }, [radius, invalidate]);

  // Following a deck for as long as it moves, then until its old shadow
  // has all but gone
  useEffect(() => {
    if (moving) refresh.current = Infinity;
    else if (refresh.current === Infinity) {
      refresh.current = SHADOW_REFRESH.settleFrames;
    }
    invalidate();
  }, [moving, invalidate]);

  useFrame(({ scene }) => {
    const api = shadow.current;
    if (refresh.current <= 0) return;
    // Until the shadow is in place, and for each frame it has left
    invalidate();
    if (!api) return;
    refresh.current--;
    // Anything at the top of the scene marked off the stage, like the
    // site's tiles, is hidden while the shadow is drawn, so only the home
    // casts it
    const offStage = scene.children.filter(
      (object) => object.userData.offStage && object.visible
    );
    offStage.forEach((object) => {
      object.visible = false;
    });
    // drei's shadow only knows the meshes there were when it was cleared,
    // and draws any others into itself as they look, so for each pass every
    // mesh is drawn as nothing but its shadow. Hidden ones aren't drawn
    // anyway, so they're passed over
    const plane = api.getMesh();
    const drawn: [Mesh, Material | Material[]][] = [];
    scene.traverseVisible((object) => {
      if (!(object instanceof Mesh) || object === plane) return;
      drawn.push([object, object.material]);
      object.material = discard;
    });
    const count = passes.current < SHADOW.frames ? 1 : SHADOW_REFRESH.passes;
    api.update(count);
    passes.current += count;
    drawn.forEach(([object, material]) => {
      object.material = material;
    });
    offStage.forEach((object) => {
      object.visible = true;
    });
    if (passes.current > SHADOW.frames) {
      const exposure = getShadowExposure(passes.current);
      plane.material.alphaTest = SHADOW.alphaTest * exposure;
      plane.material.blend = COLOR_BLEND / exposure;
    }
  });

  // The same element every render, so the shadow isn't drawn again, which
  // would clear it, until the home's size is known
  const ground = useMemo(
    () => (
      <AccumulativeShadows
        ref={shadow}
        temporal
        frames={SHADOW.frames}
        // Every pass is made in the frame loop above, rather than by drei
        limit={0}
        colorBlend={COLOR_BLEND}
        alphaTest={SHADOW.alphaTest}
        opacity={SHADOW.opacity}
        color={COLORS.shadow}
        toneMapped
        scale={radius * 4}
      >
        <RandomizedLight
          amount={8}
          radius={radius}
          ambient={0.5}
          intensity={1}
          position={MAIN.map((v) => v * radius) as [number, number, number]}
          size={radius * 4}
          bias={0.0001}
          mapSize={1024}
        />
      </AccumulativeShadows>
    ),
    [radius],
  );

  return (
    <>
      <ambientLight intensity={INTENSITY / 3} />
      <spotLight
        penumbra={1}
        position={MAIN.map((v) => v * radius) as [number, number, number]}
        intensity={INTENSITY * 2}
        castShadow
        shadow-bias={-0.0001}
        shadow-normalBias={0}
        shadow-mapSize={1024}
      />
      <pointLight
        position={FILL.map((v) => v * radius) as [number, number, number]}
        intensity={INTENSITY}
      />
      <Center onCentered={onCentered}>{children}</Center>
      <group position={[0, -height / 2, 0]}>{ground}</group>
      <Environment files={CITY_ENVIRONMENT} />
    </>
  );
};

export default HomeStage;
