import NavBar from "../../components/navbar";
import LandingModels from "../../components/landingmodels";
import Footer from "../../components/footer";
import PageMeta from "../../components/pagemeta";
import { INK, PAPER } from "../../components/panel";
import { useIsMobile } from "../../lib/media";
import MODELS from "../../lib/models";

const NUMBER = new Intl.NumberFormat("en-US");
const smallest = Math.min(...MODELS.map((model) => model.area));
const largest = Math.max(...MODELS.map((model) => model.area));

// The models page: every model as a card, the same grid the landing page
// ends with, so the lineup has a page of its own to link to
const Homes = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <PageMeta
        title="Models | ModHomes"
        description={`Compare ${MODELS.length} modern modular homes in 3D, from ${NUMBER.format(smallest)} to ${NUMBER.format(largest)} square feet, each with its beds, baths and starting price.`}
        path="/homes"
        image="/og/home.png"
        imageAlt="A ModHomes modular home beside the headline Modern, modular homes."
      />
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: isMobile ? "72px 16px 32px" : "96px 16px 64px",
          color: INK,
          backgroundColor: PAPER,
        }}
      >
        <NavBar />
        <LandingModels page />
        <Footer pinned={false} />
      </div>
    </>
  );
};

export default Homes;
