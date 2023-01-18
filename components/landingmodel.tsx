import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Typography, useMediaQuery } from "@mui/material";
import Grid from "@mui/material/Grid";
import Roof from "./roof";
import Module from "./module";
import Foundation from "./foundation";
import { COLORS } from "./colors";
import { motion } from "framer-motion";

const LandingModel = () => {
  const isMobile = useMediaQuery("(max-width:900px)");

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
      <Grid item xs={12} md={6}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Typography
            variant="h2"
            fontWeight={700}
            margin="1rem"
            textAlign={isMobile ? "center" : "left"}
          >
            Modern, modular homes.
          </Typography>
        </motion.div>
      </Grid>
      <Grid item xs={12} md={6} alignSelf={isMobile ? "flex-start" : "center"}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true }}
          style={{ height: isMobile ? "40vh" : "60vh" }}
        >
          <Canvas camera={{ position: [60, 0, 60], fov: isMobile ? 40 : 30 }}>
            <OrbitControls
              autoRotate
              maxPolarAngle={Math.PI / 2}
              enableZoom={false}
            />
            <pointLight position={[20, 40, 40]} />
            <pointLight position={[-40, -80, -80]} />
            <ambientLight intensity={0.3} />
            <Roof position={[0, 5.25, 0]} color={COLORS.roof} width={7} />
            <Module position={[0, 0, 0]} color={COLORS.grey}></Module>;
            <Foundation position={[0, -5.7, 0]} color="#dbd9d9" width={7} />
          </Canvas>
        </motion.div>
      </Grid>
    </Grid>
  );
};

export default LandingModel;
