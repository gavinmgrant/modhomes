import React, { FC, useState, useEffect, Suspense } from "react";
import { useRouter } from "next/router";
import { Canvas } from "@react-three/fiber";
import Module from "../../components/module";
import Foundation from "../../components/foundation";
import Roof from "../../components/roof";
import EndWall from "../../components/endwall";
import NavBar from "../../components/navbar";
import Ground from "../../components/ground";
import Colors, { COLORS } from "../../components/colors";
import Materials from "../../components/materials";
import Loader from "../../components/loader";
import { OrbitControls, Sky, Stage, Environment } from "@react-three/drei";
import { useSpring, animated, config } from "@react-spring/web";
import { Typography, useMediaQuery, Button } from "@mui/material";
import { IconLogin, IconLogout } from "@tabler/icons-react";

const Homes: FC = () => {
  const router = useRouter();
  const envelopeOn = true;
  const [isInside, setIsInside] = useState(false);
  const [currentArea, setCurrentArea] = useState(0);
  const [homeColor, setHomeColor] = useState(COLORS.white);
  const [floorMaterial, setFloorMaterial] = useState("walnut");
  const isMobile = useMediaQuery("(max-width:900px)");

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

  const handleInsideToggle = () => {
    setIsInside(!isInside);

    if (typeof window !== "undefined") {
      if (isInside) {
        window.localStorage.setItem("position", "outside");
      } else {
        window.localStorage.setItem("position", "inside");
      }
    }

    router.reload();
  };

  const floorArea = useSpring({
    val: currentArea,
    from: 0,
    config: config.molasses,
    clamp: true,
  }) as any;

  useEffect(() => {
    if (router.query.home === "mod1x1") {
      setCurrentArea(320 * 1);
    } else if (router.query.home === "mod2x1") {
      setCurrentArea(320 * 2);
    } else if (router.query.home === "mod2x1") {
      setCurrentArea(320 * 2);
    } else if (router.query.home === "mod3x1") {
      setCurrentArea(320 * 3);
    } else if (router.query.home === "mod4x1") {
      setCurrentArea(320 * 4);
    } else if (router.query.home === "mod5x1") {
      setCurrentArea(320 * 5);
    } else if (router.query.home === "mod2x2") {
      setCurrentArea(320 * 4);
    } else if (router.query.home === "mod3x2") {
      setCurrentArea(320 * 6);
    } else if (router.query.home === "mod4x2") {
      setCurrentArea(320 * 8);
    }
  }, [router.query.home]);

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
      </div>
      <div style={{ height: "100vh", width: "100vw", margin: 0 }}>
        {isInside ? (
          <Canvas
            camera={{
              position: [0, 0, 3.4],
              fov: 60,
            }}
            shadows
          >
            <Suspense fallback={<Loader />}>
              <OrbitControls
                minPolarAngle={Math.PI / 2}
                maxPolarAngle={Math.PI / 2}
                enableZoom={false}
              />
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
        ) : (
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
              <Ground />
            </Suspense>
          </Canvas>
        )}

        <div
          style={{
            position: "relative",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {isInside ? (
            <Materials
              floorMaterial={floorMaterial}
              handleFloorMaterial={handleFloorMaterialChange}
            />
          ) : (
            <Colors homeColor={homeColor} handleColor={handleColorChange} />
          )}

          <Button
            size="large"
            variant="text"
            onClick={handleInsideToggle}
            sx={{
              position: "absolute",
              height: isMobile ? 58 : 68,
              bottom: isMobile ? 86 : 16,
              left: isMobile ? 16 : 240,
              color: "#131414",
              border: "1px dashed #131414",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ marginRight: "0.5rem" }}>
                {isInside ? "Go Outside" : "Go Inside"}
              </div>
              {isInside ? <IconLogout /> : <IconLogin />}
            </div>
          </Button>

          <Typography
            variant="h6"
            position="absolute"
            color="#131414"
            padding={{ xs: "0.75rem", sm: "1rem" }}
            sx={{
              right: 16,
              bottom: 16,
              margin: 0,
              border: "1px dashed #131414",
              background: "none",
              borderRadius: "0.5rem",
              backdropFilter: "blur(5px)",
            }}
          >
            <animated.span>
              {floorArea.val.to((val: number) =>
                new Intl.NumberFormat().format(Math.floor(val))
              )}
            </animated.span>{" "}
            sf
          </Typography>
        </div>
      </div>
    </>
  );
};

export default Homes;
