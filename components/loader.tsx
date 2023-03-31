import { Html, useProgress } from "@react-three/drei";

const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html as="div" center style={{ width: "200px" }}>
      {progress}% complete
    </Html>
  );
};

export default Loader;
