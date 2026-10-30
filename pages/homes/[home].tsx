import React, { FC, useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/router";
import type { GetStaticPaths, GetStaticProps } from "next";
import { Canvas } from "@react-three/fiber";
import HomeModel, {
  MODEL_BASE,
  getOrbitMinDistance,
  parseModel,
} from "../../components/homemodel";
import NavBar from "../../components/navbar";
import Colors, { COLORS } from "../../components/colors";
import Materials, {
  CITY_ENVIRONMENT,
  FloorTextures,
} from "../../components/materials";
import Loader from "../../components/loader";
import InfoChip from "../../components/infochip";
import PageMeta from "../../components/pagemeta";
import ControlDock from "../../components/controldock";
import WalkControls, {
  WalkPad,
  Joystick,
  WalkInput,
  IDLE_INPUT,
  getWalkBounds,
  getWalkStart,
} from "../../components/walkcontrols";
import MODELS from "../../lib/models";
import { loadInsideView, saveInsideView } from "../../lib/viewposition";
import { OrbitControls, Sky, Stage, Environment } from "@react-three/drei";
import { useMediaQuery } from "@mui/material";

// The landscape photo is projected onto a ground plane at y = 0 with real
// parallax, so the inside scene is lifted to stand its foundation on it.
// Units are feet: the photo was taken about 6 ft up, and the flat ground
// reaches 1500 ft out before curving up into the sky dome, far enough that
// the mountains barely shift as you walk. The dome mesh itself only needs to
// sit inside the camera's far plane.
const GROUND_LIFT = -MODEL_BASE;
const LANDSCAPE = {
  files: "../images/environments/alps_field_4k.hdr",
  ground: { height: 6, radius: 1500, scale: 900 },
};

const COUNTS = ["one", "two", "three", "four", "five", "six", "seven", "eight"];

// e.g. "Mod 3x2 is a 1,920 sq ft, two-story modular home built from six modules…"
const describeModel = (name: string, area: number, slug: string) => {
  const layout = parseModel(slug);
  const modules = (layout?.cols ?? 1) * (layout?.stories ?? 1);
  const story = layout?.stories === 2 ? "two-story" : "single-story";
  const built =
    modules === 1 ? "a single module" : `${COUNTS[modules - 1]} modules`;
  return `${name} is a ${new Intl.NumberFormat("en-US").format(
    area
  )} sq ft, ${story} modular home built from ${built}. Orbit it in 3D, try an exterior color, or step inside to walk through and choose a floor finish.`;
};

// Prerendering each model puts its title and share card in the page's HTML
export const getStaticPaths: GetStaticPaths = () => ({
  paths: MODELS.map((model) => ({ params: { home: model.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = () => ({ props: {} });

const Homes: FC = () => {
  const router = useRouter();
  const [isInside, setIsInside] = useState(false);
  const [homeColor, setHomeColor] = useState(COLORS.white);
  const [floorMaterial, setFloorMaterial] = useState("walnut");
  const isMobile = useMediaQuery("(max-width:900px)");
  const isTouch = useMediaQuery("(pointer: coarse)");
  const walkInput = useRef<WalkInput>({ ...IDLE_INPUT });
  const model = MODELS.find((model) => model.slug === router.query.home);

  const layout = parseModel(router.query.home);
  const walkBounds = getWalkBounds(layout?.cols ?? 1, layout?.stories);
  const walkStart = getWalkStart(walkBounds);
  const home = layout && (
    <HomeModel
      cols={layout.cols}
      stories={layout.stories}
      color={homeColor}
      floorMaterial={floorMaterial}
    />
  );

  useEffect(() => {
    setIsInside(loadInsideView());
  }, []);

  // Swaps the canvas in place; the keyed wrappers below remount it with a fresh camera
  const handleViewChange = (inside: boolean) => {
    setIsInside(inside);
    walkInput.current = { ...IDLE_INPUT };
    saveInsideView(inside);
  };

  const handleColorChange = (color: string) => {
    setHomeColor(color);
  };

  const handleFloorMaterialChange = (floorMaterial: string) => {
    setFloorMaterial(floorMaterial);
  };

  return (
    <>
      {model && (
        <PageMeta
          title={`${model.name} · ${new Intl.NumberFormat("en-US").format(
            model.area
          )} sq ft modular home | ModHomes`}
          description={describeModel(model.name, model.area, model.slug)}
          path={`/homes/${model.slug}`}
          image={`/og/${model.slug}.png`}
          imageAlt={`3D render of the ${model.name} modular home`}
        />
      )}
      <div
        style={{ position: "relative", maxWidth: "1200px", margin: "0 auto" }}
      >
        <NavBar />
        {model && <InfoChip name={model.name} area={model.area} />}
      </div>
      <div style={{ height: "100vh", width: "100vw", margin: 0 }}>
        {isInside ? (
          // Keyed by model too, so switching models from the menu starts the
          // new one at its own corner rather than wherever the last one ended
          <div key={`inside-${router.query.home}`} className="viewer-fade">
            <Canvas
              camera={{
                position: [walkStart.x, GROUND_LIFT, walkStart.z],
                fov: 60,
              }}
              shadows
            >
              <Suspense fallback={<Loader />}>
                <WalkControls
                  bounds={walkBounds}
                  input={walkInput}
                  facing={walkStart.facing}
                />
                <ambientLight intensity={0.6} />
                <pointLight position={[100, 100, 20]} />
                <Environment {...LANDSCAPE} />
                <FloorTextures />
                <group position={[0, GROUND_LIFT, 0]}>{home}</group>
              </Suspense>
            </Canvas>
          </div>
        ) : (
          <div key="outside" className="viewer-fade">
            <Canvas
              camera={{
                position: [60, 0, 60],
                fov: isMobile ? 70 : 40,
              }}
              shadows
            >
              <Suspense fallback={<Loader />}>
                <OrbitControls
                  maxPolarAngle={Math.PI / 2}
                  minDistance={getOrbitMinDistance(
                    layout?.cols ?? 1,
                    layout?.stories ?? 1
                  )}
                  maxDistance={100}
                  enableZoom
                />
                <ambientLight intensity={0.5} />
                <pointLight position={[100, 100, 20]} />
                <Sky
                  sunPosition={[100, 100, 20]}
                  inclination={0}
                  azimuth={0.25}
                />
                <Stage
                  intensity={0.4}
                  environment={{ files: CITY_ENVIRONMENT }}
                  adjustCamera={false}
                  shadows={{
                    type: "accumulative",
                    color: COLORS.shadow,
                    opacity: 0.3,
                  }}
                >
                  {home}
                </Stage>
              </Suspense>
            </Canvas>
          </div>
        )}

        <div
          style={{
            position: "relative",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {isInside &&
            (isTouch ? (
              <Joystick input={walkInput} />
            ) : (
              <WalkPad input={walkInput} />
            ))}

          <ControlDock
            isInside={isInside}
            onViewChange={handleViewChange}
            label={isInside ? "Floor" : "Color"}
          >
            {isInside ? (
              <Materials
                floorMaterial={floorMaterial}
                handleFloorMaterial={handleFloorMaterialChange}
              />
            ) : (
              <Colors homeColor={homeColor} handleColor={handleColorChange} />
            )}
          </ControlDock>
        </div>
      </div>
    </>
  );
};

export default Homes;
