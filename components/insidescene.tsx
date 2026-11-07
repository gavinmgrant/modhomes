import React, { MutableRefObject, ReactNode, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import ApplianceHotspots from "./hotspots";
import Loader from "./loader";
import { FloorTextures } from "./materials";
import { getApplianceSpots } from "./services";
import WalkControls, {
  getWalkBounds,
  getWalkStart,
  WalkInput,
} from "./walkcontrols";
import type { ApplianceId } from "../lib/appliances";
import { FINISHED_FLOOR, MODEL_BASE } from "../lib/dimensions";

// The landscape photo is projected onto a ground plane at y = 0 with real
// parallax, so the inside scene is lifted to stand its foundation on it, and
// then some more so the grass falls away below the windows. The horizon stays
// at eye level wherever the ground is.
// Units are feet. The projection is only true from where the photo was taken,
// so it's taken at standing eye level; any lower and everything below the
// photo's horizon stretches down into streaks. The flat ground reaches out to
// the tree line, 250 ft, and curves up into the sky dome there, so the trees
// stand on the dome instead of lying smeared across the grass when you walk
// off centre. The dome mesh itself only needs to sit inside the camera's far
// plane.
const GRASS_DROP = 3;
const GROUND_LIFT = -MODEL_BASE + GRASS_DROP;
// Standing eye level, 5' 3" above the ground floor's finished surface
const EYE_LEVEL = FINISHED_FLOOR + 5.25;
// Poly Haven's Noon Grass (CC0), a mown field ringed by trees
const LANDSCAPE = {
  files: "../images/environments/noon_grass_2k.hdr",
  ground: { height: GROUND_LIFT + EYE_LEVEL, radius: 250, scale: 900 },
};

interface InsideSceneProps {
  cols: number;
  stories: number;
  // The home, built by the page, which the outside view draws too
  children: ReactNode;
  walkInput: MutableRefObject<WalkInput>;
  showSpecs: boolean;
  openAppliance: ApplianceId | null;
  onOpenAppliance: (appliance: ApplianceId | null) => void;
}

// First-person walking through the home, standing in a projected landscape,
// with spec dots on its kitchen's appliances
const InsideScene = ({
  cols,
  stories,
  children,
  walkInput,
  showSpecs,
  openAppliance,
  onOpenAppliance,
}: InsideSceneProps) => {
  const bounds = getWalkBounds(cols, stories);
  const start = getWalkStart(bounds);

  return (
    <Canvas
      camera={{
        position: [start.x, GROUND_LIFT + EYE_LEVEL, start.z],
        fov: 60,
      }}
      shadows
      // Drawn only when something changes: looking around asks for frames,
      // and so does walking, while it lasts
      frameloop="demand"
      // a click on the view, not a drag to look around, closes an
      // appliance's card
      onPointerMissed={() => onOpenAppliance(null)}
    >
      <Suspense fallback={<Loader />}>
        <WalkControls bounds={bounds} input={walkInput} facing={start.facing} />
        <ambientLight intensity={0.6} />
        <pointLight position={[100, 100, 20]} />
        <Environment {...LANDSCAPE} />
        <FloorTextures />
        <group position={[0, GROUND_LIFT, 0]}>
          {children}
          {showSpecs && (
            <ApplianceHotspots
              spots={getApplianceSpots(cols)}
              open={openAppliance}
              onOpen={onOpenAppliance}
            />
          )}
        </group>
      </Suspense>
    </Canvas>
  );
};

export default InsideScene;
