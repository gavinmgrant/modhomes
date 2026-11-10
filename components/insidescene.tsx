import React, {
  MutableRefObject,
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  ImageBitmapLoader,
  LinearFilter,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from "three";
import { GroundProjectedSkybox } from "three/examples/jsm/objects/GroundProjectedSkybox";
import ApplianceHotspots from "./hotspots";
import { LineworkRender } from "./linework";
import Loader from "./loader";
import { FloorTextures } from "./materials";
import { getApplianceSpots } from "./services";
import ViewNotice from "./viewnotice";
import WalkControls, {
  getWalkBounds,
  getWalkStart,
  WalkInput,
} from "./walkcontrols";
import type { ApplianceId } from "../lib/appliances";
import { FINISHED_FLOOR, MODEL_BASE } from "../lib/dimensions";

// The landscape photo is projected onto a ground plane at y = 0 with real
// parallax, so the inside scene is lifted to stand its foundation on it, and
// then some more so the sand falls away below the windows. Level with the
// foundation's base, the ground sat too high against this photo. The horizon
// stays at eye level wherever the ground is.
// Units are feet. The projection is only true from where the photo was taken,
// so it's taken at standing eye level; any lower and everything below the
// photo's horizon stretches down into streaks. The flat ground reaches out
// 250 ft and curves up into the sky dome there, so the boulder hills and the
// far ridges stand on the dome instead of lying smeared across the sand when
// you walk off center. The dome mesh itself only needs to sit inside the
// camera's far plane.
const GROUND_DROP = 3;
const GROUND_LIFT = -MODEL_BASE + GROUND_DROP;
// Standing eye level, 5' 3" above the ground floor's finished surface
const EYE_LEVEL = FINISHED_FLOOR + 5.25;
// Poly Haven's Rogland Overcast (CC0), sandy desert scrub under granite
// boulder hills, beneath an even overcast that lights the room softly.
// The room is lit by the small HDR. What's seen through the glass is Poly
// Haven's own tone-mapped JPG of it, recompressed: near the horizon the
// projection spreads each foot of ground over only a few texels, and at 2K
// the sand and rocks smeared into streaks
const LIGHTING = "/images/environments/rogland_overcast_1k.hdr";
const LANDSCAPE = {
  // 5.7 MB, and about 128 MB of graphics memory once uploaded
  large: "/images/environments/rogland_overcast_8k.jpg",
  // 1.4 MB, and a quarter of the memory
  small: "/images/environments/rogland_overcast_4k.jpg",
};
const GROUND = { height: GROUND_LIFT + EYE_LEVEL, radius: 250, scale: 900 };

// The 8K photo only where it's worth its memory: a screen big enough to
// show the difference, a GPU that takes a texture that size whole, and,
// where the browser says, a few GB of memory. Phones get the 4K one
const pickLandscape = (gl: WebGLRenderer) => {
  const screenSize = Math.max(window.screen.width, window.screen.height);
  const { deviceMemory = 8 } = navigator as { deviceMemory?: number };
  return gl.capabilities.maxTextureSize >= 8192 &&
    screenSize >= 1024 &&
    deviceMemory >= 4
    ? LANDSCAPE.large
    : LANDSCAPE.small;
};

// Decodes the photo off the main thread, flipped the way WebGL wants it, so
// it can't be flipped again on upload
const flipOnDecode = (loader: ImageBitmapLoader) =>
  loader.setOptions({ imageOrientation: "flipY" });

// The landscape photo projected onto the ground and the sky dome around it
const Landscape = ({ onReady }: { onReady: (ready: boolean) => void }) => {
  const gl = useThree((state) => state.gl);
  const url = useMemo(() => pickLandscape(gl), [gl]);
  const bitmap = useLoader(ImageBitmapLoader, url, flipOnDecode);
  const photo = useMemo(() => {
    const texture = new Texture(bitmap);
    texture.flipY = false;
    texture.colorSpace = SRGBColorSpace;
    // The projection wraps round the photo's seam in one step, which picks a
    // blurry mip level along it, and the photo is about one texel to a pixel
    // at the horizon anyway, so it goes up without mipmaps
    texture.generateMipmaps = false;
    texture.minFilter = LinearFilter;
    texture.needsUpdate = true;
    // Uploaded now, while the loading notice is still up, rather than in
    // the first frame that shows it
    gl.initTexture(texture);
    return texture;
  }, [bitmap, gl]);
  const skybox = useMemo(() => {
    const mesh = new GroundProjectedSkybox(photo, GROUND);
    // The JPG is tone mapped already; doing it again would flatten it
    mesh.material.toneMapped = false;
    mesh.scale.setScalar(GROUND.scale);
    return mesh;
  }, [photo]);
  useEffect(
    () => () => {
      skybox.geometry.dispose();
      skybox.material.dispose();
      photo.dispose();
    },
    [skybox, photo],
  );
  useEffect(() => {
    onReady(true);
    return () => onReady(false);
  }, [onReady]);
  return <primitive object={skybox} />;
};

// Shown in the landscape's place while its photo loads, which tells the
// page, so it can say so over the view
const LandscapePending = ({
  onPending,
}: {
  onPending: (pending: boolean) => void;
}) => {
  useEffect(() => {
    onPending(true);
    return () => onPending(false);
  }, [onPending]);
  return null;
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
  // The landscape photo is big, so the home doesn't wait for it: it comes
  // in after, with a notice over the view meanwhile
  const [landscapePending, setLandscapePending] = useState(false);
  const [landscapeReady, setLandscapeReady] = useState(false);

  return (
    <>
      {landscapePending && (
        <ViewNotice loading>Loading the landscape…</ViewNotice>
      )}
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
          <LineworkRender />
          <WalkControls
            bounds={bounds}
            input={walkInput}
            facing={start.facing}
          />
          <ambientLight intensity={0.6} />
          <pointLight position={[100, 100, 20]} />
          {/* Its HDR is the background too, a soft stand-in at the windows
            until the landscape covers it, and dropped then, as the sky
            would only be drawn behind it */}
          <Environment files={LIGHTING} background={!landscapeReady} />
          <Suspense
            fallback={<LandscapePending onPending={setLandscapePending} />}
          >
            <Landscape onReady={setLandscapeReady} />
          </Suspense>
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
    </>
  );
};

export default InsideScene;
