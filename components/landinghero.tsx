import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { Typography, useMediaQuery, Grid, Button } from "@mui/material";
import Roof from "./roof";
import Module from "./module";
import EndWall from "./endwall";
import Foundation from "./foundation";
import Loader from "./loader";
import SlidingDoors, { DoorHeader } from "./slidingdoors";
import AssembleIn, {
  ASSEMBLY,
  ROOF_OFFSET,
  SIDE_OFFSET,
  WALL_ORDER,
  getWallStep,
} from "./assembly";
import { COLORS } from "./colors";
import { CITY_ENVIRONMENT } from "./materials";
import { FOCUS_RING, PANEL } from "./panel";
import { motion } from "framer-motion";

type LandingHeroProps = {
  handleScroll: () => void;
};

const LandingHero = ({ handleScroll }: LandingHeroProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");
  // Where Stage moved the model to centre it, so the doors can sit outside
  // Stage (its framing would otherwise include panes that start 10 ft out)
  const [modelOffset, setModelOffset] = useState<
    [number, number, number] | null
  >(null);
  // Stage's ground shadow and camera fit measure whatever is in the scene, so
  // they wait until the walls and roof have landed
  const [shellBuilt, setShellBuilt] = useState(false);

  return (
    <Grid
      container
      spacing={0}
      columns={12}
      alignItems={isMobile ? "flex-end" : "center"}
      width="100%"
      height="100vh"
      margin="0 auto"
    >
      <Grid item xs={12} md={4}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: isMobile ? "1rem" : "1rem 1rem 1rem 1.2rem",
            textAlign: isMobile ? "center" : "left",
          }}
        >
          <Typography
            variant="h1"
            fontWeight={700}
            fontSize={isMobile ? "62px" : "92px"}
            lineHeight={1}
          >
            Modern, modular homes.
          </Typography>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              size="large"
              variant="outlined"
              onClick={handleScroll}
              sx={{
                ...PANEL,
                marginTop: isMobile ? "1rem" : "2rem",
                marginLeft: isMobile ? "0" : "0.5rem",
                padding: "10px 24px",
                borderRadius: 999,
                "&:hover": {
                  ...PANEL,
                  boxShadow: "0 8px 24px rgba(19, 20, 20, 0.12)",
                },
                ...FOCUS_RING,
              }}
            >
              Select a model
            </Button>
          </motion.div>
        </motion.div>
      </Grid>
      <Grid item xs={12} md={8} alignSelf={isMobile ? "flex-start" : "center"}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{ height: isMobile ? "35vh" : "65vh" }}
        >
          <Canvas camera={{ position: [60, 0, 60], fov: 30 }} shadows>
            <Suspense fallback={<Loader />}>
              <OrbitControls
                autoRotate
                maxPolarAngle={Math.PI / 2}
                enableZoom={false}
              />
              <ambientLight intensity={0.5} />
              <pointLight position={[100, 100, 20]} />
              <Stage
                intensity={0.4}
                environment={{ files: CITY_ENVIRONMENT }}
                adjustCamera
                // Stage hands extra props to its camera fit. It first fits
                // before anything moves, so it frames the finished home; any
                // refit mid-assembly would measure the pieces still flying in
                // and shift the camera, so refits wait until the shell is
                // built, and the camera jumps straight to its fit rather than
                // easing in
                {...{ damping: 0, observe: shellBuilt }}
                center={{
                  onCentered: ({ center }) =>
                    setModelOffset([-center.x, -center.y, -center.z]),
                }}
                shadows={{
                  type: "accumulative",
                  color: COLORS.shadow,
                  opacity: shellBuilt ? 0.3 : 0,
                }}
              >
                <AssembleIn
                  from={[0, ROOF_OFFSET, 0]}
                  step={ASSEMBLY.roof}
                  onDone={() => setShellBuilt(true)}
                >
                  <Roof position={[0, 5.25, 0]} color={COLORS.roof} width={7} />
                </AssembleIn>
                <EndWall
                  position={[-3.5, 0, 0]}
                  color={COLORS.grey}
                  rotate={false}
                  twoStory={false}
                  assembleStep={getWallStep(WALL_ORDER.left)}
                />
                <Module
                  position={[0, 0, 0]}
                  color={COLORS.grey}
                  envelopeOn
                  floorMaterial="walnut"
                  animateIn
                ></Module>
                <EndWall
                  position={[3.5, 0, 0]}
                  color={COLORS.grey}
                  rotate
                  twoStory={false}
                  assembleStep={getWallStep(WALL_ORDER.right)}
                />
                <Foundation
                  position={[0, -5.7, 0]}
                  color={COLORS.foundation}
                  width={7}
                />
              </Stage>
              {modelOffset && (
                <group position={modelOffset}>
                  {[-1, 1].map((side) => (
                    <React.Fragment key={side}>
                      <SlidingDoors
                        side={side}
                        halfWidth={4}
                        stories={1}
                        animateIn
                        animateDelay={ASSEMBLY.windows}
                        hideHeader
                      />
                      {/* The header arrives with its side's parapet */}
                      <AssembleIn
                        from={[side * SIDE_OFFSET, 0, 0]}
                        step={getWallStep(
                          side < 0 ? WALL_ORDER.left : WALL_ORDER.right,
                        )}
                      >
                        <DoorHeader side={side} halfWidth={4} stories={1} />
                      </AssembleIn>
                    </React.Fragment>
                  ))}
                </group>
              )}
            </Suspense>
          </Canvas>
        </motion.div>
      </Grid>
    </Grid>
  );
};

export default LandingHero;
