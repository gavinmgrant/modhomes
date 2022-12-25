import React, { FC } from "react";
import { useRouter } from "next/router";
import { Canvas } from "@react-three/fiber";
import Module from "../../components/module";
import Foundation from "../../components/foundation";
import NavBar from "../../components/navbar";
import { OrbitControls, Sky, Html } from "@react-three/drei";

const Homes: FC = () => {
  const router = useRouter();
  const taupeColor = "#B5B2B0";

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

  return (
    <div>
      <NavBar />
      <div style={{ height: "100vh" }}>
        <Canvas camera={{ position: [60, 60, 90], fov: 30 }}>
          <OrbitControls />
          <pointLight position={[20, 40, 40]} />
          <pointLight position={[-40, -80, -80]} />
          <Sky sunPosition={[100, 100, 20]} />
          {home}
          <Foundation
            position={[4, -5.7, 0]}
            color={taupeColor}
            width={foundationWidth}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default Homes;
