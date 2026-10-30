import React, { createRef, forwardRef, useRef, useState } from "react";
import { useRouter } from "next/router";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import MODELS from "../lib/models";
import { AnimatePresence, motion } from "framer-motion";
import { PANEL } from "./panel";
import ModelPreviews from "./modelpreviews";
import { saveInsideView } from "../lib/viewposition";

const LandingModels = forwardRef<HTMLDivElement>((props, ref) => {
  const router = useRouter();
  const previews = useRef(
    MODELS.map(() => createRef<HTMLDivElement>())
  ).current;
  const [shown, setShown] = useState<string[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  const cards = MODELS.map((model, index) => (
    <Grid item key={model.slug} xs={12} sm={6} md={4} lg={3}>
      <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.1 }}
          viewport={{ once: true }}
          onAnimationComplete={() =>
            setShown((slugs) => [...slugs, model.slug])
          }
        >
          <Card
            key={model.slug}
            onMouseEnter={() => setHovered(model.slug)}
            onMouseLeave={() => setHovered(null)}
            sx={{
              ...PANEL,
              borderRadius: "16px",
              cursor: "pointer",
              transition: "box-shadow 200ms ease-out",
              "&:hover": {
                boxShadow: "0 8px 24px rgba(19, 20, 20, 0.12)",
              },
            }}
            onClick={() => {
              // A card always opens the model from the outside
              saveInsideView(false);
              router.push(`/homes/${model.slug}`);
            }}
          >
            {/* The shared canvas draws this model's 3D preview into this box */}
            <div
              ref={previews[index]}
              aria-hidden
              style={{ width: "100%", height: 168 }}
            />
            <CardContent
              style={{ padding: "0 16px 20px", textAlign: "center" }}
            >
              <Typography variant="h5" fontWeight={600}>
                {model.name}
              </Typography>
              <Typography
                variant="body2"
                marginTop="0.25rem"
                sx={{ opacity: 0.7 }}
              >
                Floor Area: {new Intl.NumberFormat().format(model.area)} sf
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Grid>
  ));

  return (
    <div
      ref={ref}
      style={{
        // The section fills the screen with its content centred, so
        // "Select a model" scrolls to a framed view of the cards. svh is the
        // screen's height with any mobile browser bars showing
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "2rem 0",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Typography variant="h2" fontWeight={700} textAlign="center">
          Models
        </Typography>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Typography textAlign="center" marginBottom="2rem">
          Select a model home.
        </Typography>
      </motion.div>
      {/* The previews' canvas covers just the cards and scrolls with them */}
      <div style={{ position: "relative" }}>
        <Grid container spacing={2} columns={12}>
          <AnimatePresence>{cards}</AnimatePresence>
        </Grid>
        <ModelPreviews
          slugs={MODELS.map((model) => model.slug)}
          tracks={previews}
          shown={shown}
          hovered={hovered}
        />
      </div>
    </div>
  );
});

LandingModels.displayName = "LandingModels";

export default LandingModels;
