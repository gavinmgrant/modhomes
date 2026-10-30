import { createRef } from "react";
import Head from "next/head";
import NavBar from "../components/navbar";
import LandingModels from "../components/landingmodels";
import LandingHero from "../components/landinghero";
import Footer from "../components/footer";
import PageMeta from "../components/pagemeta";
import { CITY_ENVIRONMENT, TEXTURES } from "../components/materials";
import { useMediaQuery } from "@mui/material";

const Home = () => {
  const ref = createRef<HTMLDivElement>();
  const isMobile = useMediaQuery("(max-width:900px)");

  const handleScroll = () =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <PageMeta
        title="ModHomes · Modern, modular homes in 3D"
        description="Explore modern modular homes in 3D. Watch one assemble, compare eight models from 320 to 2,560 square feet, change the color, and walk through each one in first person."
        path="/"
        image="/og/home.png"
        imageAlt="A ModHomes modular home beside the headline Modern, modular homes."
      />
      <Head>
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
          paddingBottom: isMobile ? "1rem" : "8rem",
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
