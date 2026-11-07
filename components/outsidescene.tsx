import dynamic from "next/dynamic";
import React, { ReactNode, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import { FacingSide, FacingStore } from "./deck";
import { getOrbitMinDistance } from "./homemodel";
import HomeStage from "./homestage";
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

  return (
    <Canvas
      camera={{ position: [60, 0, 60], fov: isMobile ? 70 : 40 }}
      shadows
      // Drawn only when something changes: the orbit asks for frames as it
      // moves, and the stage's shadow, a moving deck and the site's tiles
      // each ask for them while they're under way
      frameloop="demand"
    >
      <Suspense fallback={<Loader />}>
        <OrbitControls
          maxPolarAngle={Math.PI / 2}
          minDistance={getOrbitMinDistance(cols, stories)}
          // With the site drawn there's a neighbourhood to see
          maxDistance={site.ready ? SITE_ORBIT_MAX_DISTANCE : 100}
          enableZoom
        />
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
