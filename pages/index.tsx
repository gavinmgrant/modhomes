import { createRef } from "react";
import Head from "next/head";
import NavBar from "../components/navbar";
import LandingModels from "../components/landingmodels";
import LandingHero from "../components/landinghero";
import Footer from "../components/footer";
import { CITY_ENVIRONMENT, TEXTURES } from "../components/materials";
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
        {/* Start the hero model's floor textures and lighting downloading
            alongside the page's JavaScript; crossOrigin matches how three's
            loaders request them, so the browser reuses these responses */}
        {Object.values(TEXTURES.walnut).map((href) => (
          <link
            key={href}
            rel="preload"
            as="image"
            href={href}
            crossOrigin="anonymous"
          />
        ))}
        <link
          rel="preload"
          as="fetch"
          href={CITY_ENVIRONMENT}
          crossOrigin="anonymous"
        />
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
