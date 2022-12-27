import React, { FC, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Canvas } from "@react-three/fiber";
import Module from "../../components/module";
import Foundation from "../../components/foundation";
import NavBar from "../../components/navbar";
import { OrbitControls, Sky, Cylinder } from "@react-three/drei";
import { useSpring, animated, config } from "@react-spring/web";
import { Typography, useMediaQuery } from "@mui/material";

const Homes: FC = () => {
  const router = useRouter();
  const taupeColor = "#B5B2B0";
  const [currentArea, setCurrentArea] = useState(0);
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
  }

  let home;
  switch (router.query.home) {
    case "mod1x1":
      home = <Module position={[4, 0, 0]} color={taupeColor}></Module>;
      break;
    case "mod2x1":
      home = (
        <>
          <Module position={[0, 0, 0]} color={taupeColor}></Module>
          <Module position={[8, 0, 0]} color={taupeColor}></Module>
        </>
      );
      break;
    case "mod3x1":
      home = (
        <>
          <Module position={[-4, 0, 0]} color={taupeColor}></Module>
          <Module position={[4, 0, 0]} color={taupeColor}></Module>
          <Module position={[12, 0, 0]} color={taupeColor}></Module>
        </>
      );
      break;
    case "mod4x1":
      home = (
        <>
          <Module position={[-8, 0, 0]} color={taupeColor}></Module>
          <Module position={[0, 0, 0]} color={taupeColor}></Module>
          <Module position={[8, 0, 0]} color={taupeColor}></Module>
          <Module position={[16, 0, 0]} color={taupeColor}></Module>
        </>
      );
      break;
    case "mod2x2":
      home = (
        <>
          <Module position={[0, 0, 0]} color={taupeColor}></Module>
          <Module position={[8, 0, 0]} color={taupeColor}></Module>
          <Module position={[0, 10, 0]} color={taupeColor}></Module>
          <Module position={[8, 10, 0]} color={taupeColor}></Module>
        </>
      );
      break;
    case "mod3x2":
      home = (
        <>
          <Module position={[-4, 0, 0]} color={taupeColor}></Module>
          <Module position={[4, 0, 0]} color={taupeColor}></Module>
          <Module position={[12, 0, 0]} color={taupeColor}></Module>
          <Module position={[-4, 10, 0]} color={taupeColor}></Module>
          <Module position={[4, 10, 0]} color={taupeColor}></Module>
          <Module position={[12, 10, 0]} color={taupeColor}></Module>
        </>
      );
      break;
    case "mod4x2":
      home = (
        <>
          <Module position={[-8, 0, 0]} color={taupeColor}></Module>
          <Module position={[0, 0, 0]} color={taupeColor}></Module>
          <Module position={[8, 0, 0]} color={taupeColor}></Module>
          <Module position={[16, 0, 0]} color={taupeColor}></Module>
          <Module position={[-8, 10, 0]} color={taupeColor}></Module>
          <Module position={[0, 10, 0]} color={taupeColor}></Module>
          <Module position={[8, 10, 0]} color={taupeColor}></Module>
          <Module position={[16, 10, 0]} color={taupeColor}></Module>
        </>
      );
      break;
  }

  const floorArea = useSpring({
    val: currentArea,
    from: 0,
    config: config.molasses,
    clamp: true,
    duration: 500,
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
    } else if (router.query.home === "mod2x2") {
      setCurrentArea(320 * 4);
    } else if (router.query.home === "mod3x2") {
      setCurrentArea(320 * 6);
    } else if (router.query.home === "mod4x2") {
      setCurrentArea(320 * 8);
    }
  }, [router.query.home]);

  return (
    <div>
      <NavBar />
      {/* <animated.div>{currentArea}</animated.div> */}
      <div style={{ height: "100vh" }}>
        <Canvas
          camera={{ position: [60, 60, 90], fov: isMobile ? 50 : 30 }}
          shadows
        >
          <OrbitControls maxPolarAngle={Math.PI / 2} enableZoom={false} />
          <pointLight position={[20, 40, 40]} />
          <pointLight position={[-40, -80, -80]} />
          <Sky sunPosition={[100, 100, 20]} />
          {home}
          <Foundation
            position={[4, -5.7, 0]}
            color={taupeColor}
            width={foundationWidth}
          />
          <Cylinder
            args={[1000, 1000, -1]}
            position={[0, -7, 0]}
            receiveShadow
            key={undefined}
            material={undefined}
            quaternion={undefined}
            onPointerMissed={undefined}
            attach={undefined}
            onUpdate={undefined}
            up={undefined}
            scale={undefined}
            rotation={undefined}
            matrix={undefined}
            layers={undefined}
            dispose={undefined}
            clear={undefined}
            id={undefined}
            onClick={undefined}
            onContextMenu={undefined}
            onDoubleClick={undefined}
            onPointerDown={undefined}
            onPointerMove={undefined}
            onPointerUp={undefined}
            onPointerCancel={undefined}
            onPointerEnter={undefined}
            onPointerLeave={undefined}
            onPointerOver={undefined}
            onPointerOut={undefined}
            onWheel={undefined}
            geometry={undefined}
            raycast={undefined}
            name={undefined}
            type={undefined}
            visible={undefined}
            uuid={undefined}
            parent={undefined}
            modelViewMatrix={undefined}
            normalMatrix={undefined}
            matrixWorld={undefined}
            matrixAutoUpdate={undefined}
            matrixWorldNeedsUpdate={undefined}
            castShadow={undefined}
            frustumCulled={undefined}
            renderOrder={undefined}
            animations={undefined}
            userData={undefined}
            customDepthMaterial={undefined}
            customDistanceMaterial={undefined}
            isObject3D={undefined}
            onBeforeRender={undefined}
            onAfterRender={undefined}
            applyMatrix4={undefined}
            applyQuaternion={undefined}
            setRotationFromAxisAngle={undefined}
            setRotationFromEuler={undefined}
            setRotationFromMatrix={undefined}
            setRotationFromQuaternion={undefined}
            rotateOnAxis={undefined}
            rotateOnWorldAxis={undefined}
            rotateX={undefined}
            rotateY={undefined}
            rotateZ={undefined}
            translateOnAxis={undefined}
            translateX={undefined}
            translateY={undefined}
            translateZ={undefined}
            localToWorld={undefined}
            worldToLocal={undefined}
            lookAt={undefined}
            add={undefined}
            remove={undefined}
            removeFromParent={undefined}
            getObjectById={undefined}
            getObjectByName={undefined}
            getObjectByProperty={undefined}
            getWorldPosition={undefined}
            getWorldQuaternion={undefined}
            getWorldScale={undefined}
            getWorldDirection={undefined}
            traverse={undefined}
            traverseVisible={undefined}
            traverseAncestors={undefined}
            updateMatrix={undefined}
            updateMatrixWorld={undefined}
            updateWorldMatrix={undefined}
            toJSON={undefined}
            clone={undefined}
            copy={undefined}
            addEventListener={undefined}
            hasEventListener={undefined}
            removeEventListener={undefined}
            dispatchEvent={undefined}
            morphTargetInfluences={undefined}
            morphTargetDictionary={undefined}
            isMesh={undefined}
            updateMorphTargets={undefined}
          >
            <meshBasicMaterial color={taupeColor} />
          </Cylinder>
        </Canvas>
        <Typography
          variant="h6"
          position="absolute"
          color="#01257D"
          style={{ right: 16, bottom: 12 }}
        >
          <animated.span>
            {floorArea.val.to((val: number) =>
              new Intl.NumberFormat().format(Math.floor(val))
            )}
          </animated.span>{" "}
          SF
        </Typography>
      </div>
    </div>
  );
};

export default Homes;
