import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  AccumulativeShadows,
  Center,
  Environment,
  RandomizedLight,
  shaderMaterial,
} from "@react-three/drei";
import type { OnCenterCallbackProps } from "@react-three/drei";
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

// drei's types for these lean on three's, which aren't installed here, and
// without them they ask for every prop a group has
type Loose = React.ForwardRefExoticComponent<any>;
const Shadows = AccumulativeShadows as unknown as Loose;
const ShadowLight = RandomizedLight as unknown as Loose;
const Centred = Center as unknown as Loose;

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

interface HomeStageProps {
  children: ReactNode;
  // Whether anything in the home is moving, so the shadow should follow it
  moving?: boolean;
}

const HomeStage = ({ children, moving = false }: HomeStageProps) => {
  const [{ radius, height }, setSize] = useState({ radius: 0, height: 0 });
  const onCentered = useCallback(
    ({ height, boundingSphere }: OnCenterCallbackProps) =>
      setSize({ radius: boundingSphere.radius, height }),
    [],
  );
  // three has no type definitions installed here, so the refs are untyped
  const shadow = useRef<any>(null);
  const discard = useMemo(() => new DiscardMaterial(), []);
  // Passes blended into the shadow since it was last cleared, and frames
  // left to keep adding them
  const passes = useRef(0);
  const refresh = useRef(0);

  // The shadow starts over when it's drawn again, once the home's size is
  // known
  useEffect(() => {
    passes.current = 0;
    refresh.current = SHADOW.frames;
  }, [radius]);

  // Following a deck for as long as it moves, then until its old shadow
  // has all but gone
  useEffect(() => {
    if (moving) refresh.current = Infinity;
    else if (refresh.current === Infinity) {
      refresh.current = SHADOW_REFRESH.settleFrames;
    }
  }, [moving]);

  useFrame(({ scene }) => {
    const api = shadow.current;
    if (refresh.current <= 0 || !api) return;
    refresh.current--;
    // drei's shadow only knows the meshes there were when it was cleared,
    // and draws any others into itself as they look, so for each pass every
    // mesh is drawn as nothing but its shadow
    const plane = api.getMesh();
    const drawn: [any, any][] = [];
    scene.traverse((object: any) => {
      if (!object.isMesh || object === plane) return;
      drawn.push([object, object.material]);
      object.material = discard;
    });
    const count = passes.current < SHADOW.frames ? 1 : SHADOW_REFRESH.passes;
    api.update(count);
    passes.current += count;
    drawn.forEach(([object, material]) => {
      object.material = material;
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
      <Shadows
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
        <ShadowLight
          amount={8}
          radius={radius}
          ambient={0.5}
          intensity={1}
          position={MAIN.map((v) => v * radius) as [number, number, number]}
          size={radius * 4}
          bias={0.0001}
          mapSize={1024}
        />
      </Shadows>
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
      <Centred onCentered={onCentered}>{children}</Centred>
      <group position={[0, -height / 2, 0]}>{ground}</group>
      <Environment files={CITY_ENVIRONMENT} />
    </>
  );
};

export default HomeStage;
