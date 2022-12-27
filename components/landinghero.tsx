import Head from "next/head";
import { useRouter } from "next/router";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import MODELS from "../lib/models";

const LandingHero = () => {
  const router = useRouter();

  return (
    <>
      <Typography
        variant="h2"
        fontWeight={700}
        marginTop={{ xs: "5rem", sm: "6rem" }}
      >
        Models
      </Typography>
      <Typography marginBottom="2rem">Select a model home.</Typography>

      <Grid container spacing={2} columns={12}>
        {MODELS.map((model) => (
          <Grid item key={model.slug} xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
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
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default LandingHero;
