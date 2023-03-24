import React, { FC, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Canvas } from "@react-three/fiber";
import Module from "../../components/module";
import Foundation from "../../components/foundation";
import Roof from "../../components/roof";
import EndWall from "../../components/endwall";
import NavBar from "../../components/navbar";
import Ground from "../../components/ground";
import Colors, { COLORS } from "../../components/colors";
import { OrbitControls, Sky, Stage } from "@react-three/drei";
import { useSpring, animated, config } from "@react-spring/web";
import { Typography, useMediaQuery } from "@mui/material";

const Homes: FC = () => {
  const router = useRouter();
  const envelopeOn = true;
  const [currentArea, setCurrentArea] = useState(0);
  const [homeColor, setHomeColor] = useState(COLORS.white);
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
          ></Module>
          <Module
            position={[4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
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
          ></Module>
          <Module
            position={[0, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
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
          ></Module>
          <Module
            position={[-4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[12, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
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
          ></Module>
          <Module
            position={[-8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[0, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[16, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
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
          ></Module>
          <Module
            position={[4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[-4, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[4, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
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
          ></Module>
          <Module
            position={[0, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[8, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[-8, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[0, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[8, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
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
          ></Module>
          <Module
            position={[-4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[4, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[12, 0, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[-12, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[-4, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[4, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
          ></Module>
          <Module
            position={[12, 10, 0]}
            color={homeColor}
            envelopeOn={envelopeOn}
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

  const isTwoStory = router.query.home?.includes("x2");

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

  return (
    <>
      <div
        style={{ position: "relative", maxWidth: "1200px", margin: "0 auto" }}
      >
        <NavBar />
      </div>
      <div style={{ height: "100vh", width: "100vw", margin: 0 }}>
        <Canvas
          camera={{ position: [60, 0, 60], fov: isMobile ? 70 : 40 }}
          shadows
        >
          <OrbitControls maxPolarAngle={Math.PI / 2} maxDistance={100} />
          <ambientLight intensity={0.5} />
          <pointLight position={[100, 100, 20]} />
          <Sky sunPosition={[100, 100, 20]} inclination={0} azimuth={0.25} />
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
            {roofHeight && (
              <Roof
                position={[0, roofHeight, 0]}
                color={COLORS.roof}
                width={foundationWidth}
              />
            )}
          </Stage>
          <Ground />
        </Canvas>
        <div
          style={{
            position: "relative",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <Colors homeColor={homeColor} handleColor={handleColorChange} />
          <Typography
            variant="h6"
            position="absolute"
            color="#131414"
            padding={{ xs: "0.75rem", sm: "1rem" }}
            style={{
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
