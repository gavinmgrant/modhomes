import dynamic from "next/dynamic";
import React, { ReactNode, Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import { FacingSide, FacingStore } from "./deck";
import { getOrbitMinDistance, getOrbitTargetY } from "./homemodel";
import HomeStage from "./homestage";
import { LineworkRender } from "./linework";
import Loader from "./loader";
import type { SiteView } from "./sitemap";
import { SITE_ORBIT_MAX_DISTANCE } from "../lib/site";
import { useIsMobile } from "../lib/media";

// The tiles' renderer reaches for the browser's document as it loads, so
// it's only loaded in the browser, and only once a page has the site key
const SiteTiles = dynamic(
  () => import("./sitetiles").then((m) => m.SiteTiles),
  { ssr: false },
);

// drei's Sky, which passes on props its types leave out, like where it
// comes in the drawing order
const Backdrop = Sky as unknown as React.FC<Record<string, unknown>>;

// The page keeps this view as the model changes, so the camera moves up or
// down with the orbit target when it does, keeping the view as level as it
// was
const EyeLevel = ({ y }: { y: number }) => {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const last = useRef(y);
  useEffect(() => {
    camera.position.y += y - last.current;
    last.current = y;
    invalidate();
  }, [y, camera, invalidate]);
  return null;
};

interface OutsideSceneProps {
  cols: number;
  stories: number;
  // The home, built by the page, which the inside view draws too
  children: ReactNode;
  // Whether a deck is on its way down or up, so the stage redraws its shadow
  decksMoving: boolean;
  facing: FacingStore;
  site: SiteView;
}

// The home on its stage under the sky, orbited from outside, and, with the
// Site switch on, standing on Google's 3D tiles of its lot
const OutsideScene = ({
  cols,
  stories,
  children,
  decksMoving,
  facing,
  site,
}: OutsideSceneProps) => {
  const isMobile = useIsMobile();
  const eye = getOrbitTargetY(stories);

  return (
    <Canvas
      // Level with the orbit target, at eye level over the ground floor
      camera={{ position: [60, eye, 60], fov: isMobile ? 70 : 40 }}
      shadows
      // Drawn only when something changes: the orbit asks for frames as it
      // moves, and the stage's shadow, a moving deck and the site's tiles
      // each ask for them while they're under way
      frameloop="demand"
    >
      <Suspense fallback={<Loader />}>
        <LineworkRender />
        <OrbitControls
          target={[0, eye, 0]}
          maxPolarAngle={Math.PI / 2}
          minDistance={getOrbitMinDistance(cols, stories)}
          // With the site drawn there's a neighbourhood to see
          maxDistance={site.ready ? SITE_ORBIT_MAX_DISTANCE : 100}
          enableZoom
        />
        <EyeLevel y={eye} />
        <FacingSide store={facing} />
        <ambientLight intensity={0.5} />
        <pointLight position={[100, 100, 20]} />
        <Backdrop
          sunPosition={[100, 100, 20]}
          inclination={0}
          azimuth={0.25}
          // Drawn first, and behind everything, so the site's
          // tiles reaching past it to the horizon still show
          renderOrder={-1}
          material-depthTest={false}
        />
        {site.shown && (
          <SiteTiles apiKey={site.apiKey} groundY={site.groundY} />
        )}
        <HomeStage
          moving={decksMoving}
          // The stage centres the home on the origin, so the ground
          // is half its height down
          onSized={({ height }) => {
            site.groundY.current = -height / 2;
          }}
        >
          {children}
        </HomeStage>
      </Suspense>
    </Canvas>
  );
};

export default OutsideScene;
