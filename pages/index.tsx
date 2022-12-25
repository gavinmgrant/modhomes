import Head from "next/head";
import { useRouter } from "next/router";
import NavBar from "../components/navbar";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { Box } from "@mui/material";
import MODELS from "../lib/models";

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>ModHomes</title>
        <meta name="description" content="Modular home website prototype" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box minHeight="100vh" padding="1rem" color="#01257D">
        <NavBar />
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
                <CardContent>
                  <Typography variant="h4">{model.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
}
