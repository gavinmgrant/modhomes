import Head from "next/head";
import NavBar from "../components/navbar";
import LandingHero from "../components/landinghero";

const Home = () => {
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
          color: "#131414",
          backgroundColor: "#f9f7f1",
        }}
      >
        <NavBar />
        <LandingHero />
      </div>
    </>
  );
};

export default Home;
