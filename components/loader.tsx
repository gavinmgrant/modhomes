import { textAlign } from "@mui/system";
import { Html, useProgress } from "@react-three/drei";

const Loader = () => {
  const { progress } = useProgress();
  const progressToShow = Math.floor(progress);

  return (
    <Html as="div" center style={{ width: "200px", textAlign: "center" }}>
      {progressToShow}% complete
    </Html>
  );
};

export default Loader;
