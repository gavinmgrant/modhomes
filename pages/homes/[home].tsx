import React, { FC, useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/router";
import { Canvas } from "@react-three/fiber";
import HomeModel, { MODEL_BASE, parseModel } from "../../components/homemodel";
import NavBar from "../../components/navbar";
import Colors, { COLORS } from "../../components/colors";
import Materials, { CITY_ENVIRONMENT } from "../../components/materials";
import Loader from "../../components/loader";
import InfoChip from "../../components/infochip";
import ControlDock from "../../components/controldock";
import WalkControls, {
  WalkPad,
  Joystick,
  WalkInput,
  IDLE_INPUT,
  getWalkBounds,
} from "../../components/walkcontrols";
import MODELS from "../../lib/models";
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
  const home = layout && (
    <HomeModel
      cols={layout.cols}
      stories={layout.stories}
      color={homeColor}
      floorMaterial={floorMaterial}
    />
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const position = window.localStorage.getItem("position");
      position === "inside" ? setIsInside(true) : setIsInside(false);
    }
  }, []);

  // Swaps the canvas in place; the keyed wrappers below remount it with a fresh camera
  const handleViewChange = (inside: boolean) => {
    setIsInside(inside);
    walkInput.current = { ...IDLE_INPUT };
    window.localStorage.setItem("position", inside ? "inside" : "outside");
  };

  const handleColorChange = (color: string) => {
    setHomeColor(color);
  };

  const handleFloorMaterialChange = (floorMaterial: string) => {
    setFloorMaterial(floorMaterial);
  };

  return (
    <>
      <div
        style={{ position: "relative", maxWidth: "1200px", margin: "0 auto" }}
      >
        <NavBar />
        {model && <InfoChip name={model.name} area={model.area} />}
      </div>
      <div style={{ height: "100vh", width: "100vw", margin: 0 }}>
        {isInside ? (
          <div key="inside" className="viewer-fade">
            <Canvas
              camera={{
                position: [0, GROUND_LIFT, 3.4],
                fov: 60,
              }}
              shadows
            >
              <Suspense fallback={<Loader />}>
                <WalkControls bounds={walkBounds} input={walkInput} />
                <ambientLight intensity={0.6} />
                <pointLight position={[100, 100, 20]} />
                <Environment {...LANDSCAPE} />
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
