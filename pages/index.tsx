import { createRef } from "react";
import Head from "next/head";
import NavBar from "../components/navbar";
import LandingModels from "../components/landingmodels";
import LandingHero from "../components/landinghero";
import Footer from "../components/footer";
import { useMediaQuery } from "@mui/material";

const Home = () => {
  const ref = createRef<HTMLDivElement>();
  const isMobile = useMediaQuery("(max-width:900px)");

  const handleScroll = () =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <Head>
        <title>ModHomes</title>
        <meta name="description" content="Modular home website prototype" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "1rem",
          paddingBottom: isMobile ? "1rem" : "4rem",
          color: "#131414",
          backgroundColor: "#f9f7f1",
        }}
      >
        <NavBar />
        <LandingHero handleScroll={handleScroll} />
        <LandingModels ref={ref} />
        <Footer />
      </div>
    </>
  );
};

export default Home;
