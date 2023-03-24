import { FC } from "react";
import { useRouter } from "next/router";
import { Cylinder } from "@react-three/drei";
import { COLORS } from "./colors";

const Ground: FC = () => {
  const router = useRouter();

  const isTwoStory = router.query.home?.includes("x2");

  return (
    <Cylinder
      args={[1000, 1000, -1]}
      position={[0, isTwoStory ? -12 : -7, 0]}
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
      <meshBasicMaterial color={COLORS.ground} />
    </Cylinder>
  );
};

export default Ground;
