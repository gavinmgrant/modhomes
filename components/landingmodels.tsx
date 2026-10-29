import React, { forwardRef } from "react";
import { useRouter } from "next/router";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import MODELS from "../lib/models";
import { AnimatePresence, motion } from "framer-motion";
import { PANEL } from "./panel";

const LandingModels = forwardRef<HTMLDivElement>((props, ref) => {
  const router = useRouter();

  const cards = MODELS.map((model, index) => (
    <Grid item key={model.slug} xs={12} sm={6} md={4} lg={3}>
      <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.1 }}
          viewport={{ once: true }}
        >
          <Card
            key={model.slug}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              ...PANEL,
              borderRadius: "16px",
              cursor: "pointer",
              height: "8rem",
              transition: "box-shadow 200ms ease-out",
              "&:hover": {
                boxShadow: "0 8px 24px rgba(19, 20, 20, 0.12)",
              },
            }}
            onClick={() => router.push(`/homes/${model.slug}`)}
          >
            <CardContent style={{ padding: 0, margin: 0 }}>
              <Typography variant="h4">{model.name}</Typography>
              <Typography variant="body1" margin="0.25rem 0">
                Floor Area: {model.area} sf
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Grid>
  ));

  return (
    <div ref={ref} style={{ minHeight: "75vh" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Typography
          variant="h2"
          fontWeight={700}
          textAlign="center"
          marginTop={{ xs: "5rem", sm: "6rem" }}
        >
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
      <Grid container spacing={2} columns={12}>
        <AnimatePresence>{cards}</AnimatePresence>
      </Grid>
    </div>
  );
});

LandingModels.displayName = "LandingModels";

export default LandingModels;
