import React, { FC, useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/router";
import { Canvas } from "@react-three/fiber";
import Module from "../../components/module";
import Foundation from "../../components/foundation";
import Roof from "../../components/roof";
import EndWall from "../../components/endwall";
import NavBar from "../../components/navbar";
import Colors, { COLORS } from "../../components/colors";
import Materials from "../../components/materials";
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

const Homes: FC = () => {
  const router = useRouter();
  const envelopeOn = true;
  const [isInside, setIsInside] = useState(false);
  const [homeColor, setHomeColor] = useState(COLORS.white);
  const [floorMaterial, setFloorMaterial] = useState("walnut");
  const isMobile = useMediaQuery("(max-width:900px)");
  const isTouch = useMediaQuery("(pointer: coarse)");
  const walkInput = useRef<WalkInput>({ ...IDLE_INPUT });
  const model = MODELS.find((model) => model.slug === router.query.home);

  let foundationWidth;
  const w = router.query.home?.slice(3, 4);
  switch (w) {
    case "1":
      foundationWidth = 7;
      break;
    case "2":
      foundationWidth = 15;
      break;
    case "3":
      foundationWidth = 23;
      break;
    case "4":
      foundationWidth = 31;
      break;
    case "5":
      foundationWidth = 39;
      break;
  }
  const walkBounds = getWalkBounds(Number(w) || 1);

  let roofHeight;
  const stories = router.query.home?.slice(5);
  switch (stories) {
    case "1":
      roofHeight = 5.3;
      break;
    case "2":
      roofHeight = 15.3;
      break;
  }

  let home;
  switch (router.query.home) {
    case "mod1x1":
      home = (
        <>
          {envelopeOn && (
            <EndWall
              position={[-3.5, 0, 0]}
              color={homeColor}
              rotate={false}
              twoStory={false}
            />
          )}
          <Module
            position={[0, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          {envelopeOn && (
            <EndWall
              position={[3.5, 0, 0]}
              color={homeColor}
              rotate
              twoStory={false}
            />
          )}
        </>
      );
      break;
    case "mod2x1":
      home = (
        <>
          {envelopeOn && (
            <EndWall
              position={[-7.5, 0, 0]}
              color={homeColor}
              rotate={false}
              twoStory={false}
            />
          )}
          <Module
            position={[-4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          {envelopeOn && (
            <EndWall
              position={[7.5, 0, 0]}
              color={homeColor}
              rotate
              twoStory={false}
            />
          )}
        </>
      );
      break;
    case "mod3x1":
      home = (
        <>
          {envelopeOn && (
            <EndWall
              position={[-11.5, 0, 0]}
              color={homeColor}
              rotate={false}
              twoStory={false}
            />
          )}
          <Module
            position={[-8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[0, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          {envelopeOn && (
            <EndWall
              position={[11.5, 0, 0]}
              color={homeColor}
              rotate
              twoStory={false}
            />
          )}
        </>
      );
      break;
    case "mod4x1":
      home = (
        <>
          {envelopeOn && (
            <EndWall
              position={[-15.5, 0, 0]}
              color={homeColor}
              rotate={false}
              twoStory={false}
            />
          )}
          <Module
            position={[-12, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[-4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[12, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          {envelopeOn && (
            <EndWall
              position={[15.5, 0, 0]}
              color={homeColor}
              rotate
              twoStory={false}
            />
          )}
        </>
      );
      break;
    case "mod5x1":
      home = (
        <>
          {envelopeOn && (
            <EndWall
              position={[-19.5, 0, 0]}
              color={homeColor}
              rotate={false}
              twoStory={false}
            />
          )}
          <Module
            position={[-16, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[-8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[0, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[16, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          {envelopeOn && (
            <EndWall
              position={[19.5, 0, 0]}
              color={homeColor}
              rotate
              twoStory={false}
            />
          )}
        </>
      );
      break;
    case "mod2x2":
      home = (
        <>
          {envelopeOn && (
            <EndWall
              position={[-7.5, 0, 0]}
              color={homeColor}
              rotate={false}
              twoStory
            />
          )}
          <Module
            position={[-4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[-4, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[4, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          {envelopeOn && (
            <EndWall position={[7.5, 0, 0]} color={homeColor} rotate twoStory />
          )}
        </>
      );
      break;
    case "mod3x2":
      home = (
        <>
          {envelopeOn && (
            <EndWall
              position={[-11.5, 0, 0]}
              color={homeColor}
              rotate={false}
              twoStory
            />
          )}
          <Module
            position={[-8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[0, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[-8, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[0, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[8, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          {envelopeOn && (
            <EndWall
              position={[11.5, 0, 0]}
              color={homeColor}
              rotate
              twoStory
            />
          )}
        </>
      );
      break;
    case "mod4x2":
      home = (
        <>
          {envelopeOn && (
            <EndWall
              position={[-15.5, 0, 0]}
              color={homeColor}
              rotate={false}
              twoStory
            />
          )}
          <Module
            position={[-12, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[-4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[12, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[-12, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[-4, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[4, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          <Module
            position={[12, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
            floorMaterial={floorMaterial}
          ></Module>
          {envelopeOn && (
            <EndWall
              position={[15.5, 0, 0]}
              color={homeColor}
              rotate
              twoStory
            />
          )}
        </>
      );
      break;
  }

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
                position: [0, 0, 3.4],
                fov: 60,
              }}
              shadows
            >
              <Suspense fallback={<Loader />}>
                <WalkControls bounds={walkBounds} input={walkInput} />
                <ambientLight intensity={0.6} />
                <pointLight position={[100, 100, 20]} />
                <Environment
                  background
                  files="../images/environments/alps_field_4k.hdr"
                />
                {home}
                <Foundation
                  position={[0, -5.7, 0]}
                  color={COLORS.foundation}
                  width={foundationWidth}
                />
                <Roof
                  position={[0, roofHeight || 0, 0]}
                  color={COLORS.roof}
                  width={foundationWidth}
                />
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
                  environment="city"
                  adjustCamera={false}
                  shadows={{
                    type: "accumulative",
                    color: COLORS.shadow,
                    opacity: 0.3,
                  }}
                >
                  {home}
                  <Foundation
                    position={[0, -5.7, 0]}
                    color={COLORS.foundation}
                    width={foundationWidth}
                  />
                  <Roof
                    position={[0, roofHeight || 0, 0]}
                    color={COLORS.roof}
                    width={foundationWidth}
                  />
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
