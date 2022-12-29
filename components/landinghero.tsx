import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import MODELS from "../lib/models";
import { useTrail, a } from "@react-spring/web";

const LandingHero = () => {
  const router = useRouter();

  const cards = MODELS.map((model) => (
    <Card
      key={model.slug}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "1rem",
        backgroundColor: "#B5B2B0",
        color: "#01257D",
        borderRadius: "0.5rem",
        cursor: "pointer",
        height: "8rem",
        border: "0.25rem solid #B5B2B0",
        "&:hover": {
          border: "0.25rem solid #01257D",
        },
      }}
      onClick={() => router.push(`/homes/${model.slug}`)}
    >
      <CardContent style={{ padding: 0, margin: 0 }}>
        <Typography variant="h4">{model.name}</Typography>
      </CardContent>
    </Card>
  ));

  const [trails, api] = useTrail(
    cards.length,
    {
      config: { mass: 5, tension: 2000, friction: 200 },
      from: { x: 30, opacity: 0 },
      to: { x: 0, opacity: 1 },
    },
    []
  );

  useEffect(() => {
    const handleRouteChange = () => api.start({ x: 30, opacity: 0 });
    router.events.on("routeChangeStart", handleRouteChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {trails.map(({ ...style }, index) => (
          <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
            <a.div style={style}>
              <a.div>{cards[index]}</a.div>
            </a.div>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default LandingHero;
