import React from "react";
import { useRouter } from "next/router";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import MODELS from "../lib/models";

const LandingHero = () => {
  const router = useRouter();

  const cards = MODELS.map((model) => (
    <Grid item key={model.slug} xs={12} sm={6} md={4} lg={3}>
      <Card
        key={model.slug}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "none",
          boxShadow: "none",
          color: "#01257D",
          borderRadius: "0.5rem",
          cursor: "pointer",
          height: "8rem",
          border: "1px dashed #01257D",
          "&:hover": {
            border: "1.5px dashed #01257D",
          },
        }}
        onClick={() => router.push(`/homes/${model.slug}`)}
      >
        <CardContent style={{ padding: 0, margin: 0 }}>
          <Typography variant="h4">{model.name}</Typography>
        </CardContent>
      </Card>
    </Grid>
  ));

  return (
    <>
      <Typography
        variant="h2"
        fontWeight={700}
        textAlign="center"
        marginTop={{ xs: "5rem", sm: "6rem" }}
      >
        Models
      </Typography>
      <Typography textAlign="center" marginBottom="2rem">
        Select a model home.
      </Typography>
      <Grid container spacing={2} columns={12}>
        {cards}
      </Grid>
    </>
  );
};

export default LandingHero;
