import React, { ReactNode } from "react";
import Link from "next/link";
import NavBar from "../components/navbar";
import Footer from "../components/footer";
import PageMeta from "../components/pagemeta";
import { INK, ink, PAPER, PANEL, PANEL_RADIUS } from "../components/panel";
import { useIsMobile } from "../lib/media";

// For builders: what ModHomes shows is possible, and what it would take to
// do the same for a builder's own homes. A short version of
// docs/FOR-BUILDERS.md, which it links to for the rest

export const CONTACT_EMAIL = "gavin@gavingrant.com";
const REPO = "https://github.com/gavinmgrant/modhomes";
export const FULL_VERSION_URL = `${REPO}/blob/main/docs/FOR-BUILDERS.md`;
export const HOW_ITS_BUILT_URL = `${REPO}/blob/main/docs/ARCHITECTURE.md`;
// The README's tour of the hardest parts, for anyone weighing my work
export const WHAT_IT_SHOWS_URL = `${REPO}#what-this-shows`;
const PORTFOLIO_URL = "https://www.gavingrant.com";
export const LINKEDIN_URL = "https://www.linkedin.com/in/gavinmgrant/";
// The home in the README's first screenshot, to try from here
export const DEMO_HOME = "/homes/mod3x2?wood=walnut&decks=left,right";

const card = {
  ...PANEL,
  borderRadius: PANEL_RADIUS,
  padding: "20px 24px",
};

const heading = { fontSize: 18, fontWeight: 600, marginBottom: 12 };

const list = {
  display: "grid",
  gap: 8,
  paddingLeft: 20,
  fontSize: 15,
  lineHeight: 1.5,
};

const button = {
  display: "inline-block",
  textAlign: "center" as const,
  borderRadius: 999,
  padding: "12px 24px",
  fontSize: 15,
  fontWeight: 600,
};

const primary = { ...button, background: INK, color: PAPER };
const secondary = {
  ...button,
  border: `1px solid ${ink(0.2)}`,
  color: INK,
};

// A card under a section heading of its own takes the next level down
const Card = ({
  title,
  children,
  level = 2,
}: {
  title: string;
  children: ReactNode;
  level?: 2 | 3;
}) => {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <section aria-label={title} style={card}>
      <Heading style={heading}>{title}</Heading>
      {children}
    </section>
  );
};

const Builders = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <PageMeta
        title="For builders | ModHomes"
        description="A demo of what modular home builders could offer online: homes configured in 3D, walked through, seen on a lot and priced as they're configured. Here's what it would take for your homes, and two ways to work together."
        path="/builders"
        image="/og/home.png"
        imageAlt="A ModHomes modular home beside the headline Modern, modular homes."
      />
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: isMobile ? "88px 16px 32px" : "112px 16px 64px",
          color: INK,
          backgroundColor: PAPER,
        }}
      >
        <NavBar />
        <header style={{ maxWidth: 680, marginBottom: 32 }}>
          <p style={{ fontSize: 14, fontWeight: 600, opacity: 0.6 }}>
            For builders
          </p>
          <h1
            style={{
              fontSize: isMobile ? 32 : 44,
              fontWeight: 600,
              lineHeight: 1.1,
              margin: "8px 0 16px",
            }}
          >
            Bring your homes to the browser
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, opacity: 0.8 }}>
            ModHomes is a demo I built for a made-up modular home builder. It
            shows what your buyers could do online: configure one of your homes
            in 3D, walk through it, see it on a lot, and reserve it, with a
            price that updates as they go.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            Built by Gavin Grant: an architect on Marmol Radziner&apos;s prefab
            team, then in sales at Connect Homes, and a web developer since
            2020. I can build this for your homes, or join your team to build
            and run it.
          </p>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}
          >
            <a href={`mailto:${CONTACT_EMAIL}`} style={primary}>
              Email me
            </a>
            <Link href={DEMO_HOME} style={secondary}>
              Try a home
            </Link>
            <Link href="/homes" style={secondary}>
              Browse the models
            </Link>
          </div>
        </header>

        <section aria-label="Two ways to work together" style={{ marginBottom: 24 }}>
          <h2 style={{ ...heading, fontSize: 22 }}>Two ways to work together</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 24,
            }}
          >
            <Card title="I build it for you" level={3}>
              <p style={{ fontSize: 15, lineHeight: 1.6 }}>
                A project for your homes, built in phases: your models and
                prices first, then your buyers&apos; lots, your factory and the
                whole purchase. Each phase is useful on its own, and it works
                alongside the tools you already use.
              </p>
            </Card>
            <Card title="I join your team" level={3}>
              <p style={{ fontSize: 15, lineHeight: 1.6 }}>
                Someone who has designed prefab homes, sold them, and builds
                web software, to own your configurator and the tools your
                buyers and sales team use online.{" "}
                <a
                  href={WHAT_IT_SHOWS_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontWeight: 600, textDecoration: "underline" }}
                >
                  See what this demo shows I can do
                </a>
                .
              </p>
            </Card>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <Card title="What it could do for your sales">
            <ul style={list}>
              <li>Buyers who know the price before they contact you.</li>
              <li>
                A link to every home a buyer configures, sent to your CRM as a
                lead.
              </li>
              <li>
                Fewer surprises, since buyers walk through the home before they
                sign.
              </li>
              <li>Your home shown on the buyer&apos;s own lot.</li>
              <li>
                A head start for your factory, from a model that counts what
                each home is built from.
              </li>
            </ul>
          </Card>
          <Card title="What it would take">
            <ul style={list}>
              <li>Plans for your models, and how their modules are built.</li>
              <li>Your options, and which ones go together.</li>
              <li>Your prices, or the costs behind them.</li>
              <li>Your factories, where you deliver, and your approved plans.</li>
              <li>How you sell: your CRM, deposits and follow-up.</li>
              <li>Your logo, fonts, colors and photos.</li>
            </ul>
          </Card>
          <Card title="Built in phases">
            <ol style={list}>
              <li>
                <strong>Your homes and prices.</strong> Your models and finishes
                in 3D, prices your staff can edit, and configurations sent to
                your CRM.
              </li>
              <li>
                <strong>Your buyers&apos; lots.</strong> Buyers enter an
                address, see the home on it, and learn whether it fits.
              </li>
              <li>
                <strong>To your factory.</strong> Options checked against your
                engineering, and a parts list for each order.
              </li>
              <li>
                <strong>The whole purchase.</strong> Real schedules, financing
                estimates, and orders buyers can follow to move-in.
              </li>
            </ol>
            <p style={{ fontSize: 14, opacity: 0.7, marginTop: 12 }}>
              Each phase is useful on its own.
            </p>
          </Card>
          <Card title="Good to know">
            <ul style={list}>
              <li>
                It works alongside your website, CRM, pricing and design tools,
                rather than replacing them.
              </li>
              <li>
                Prices are estimates. Your purchase agreement sets the final
                one, as it does today.
              </li>
              <li>
                Delivery and site work are quoted per job, so they&apos;d show
                as a range until a site visit.
              </li>
              <li>
                It only offers what your approved plans cover where the buyer
                is building.
              </li>
            </ul>
          </Card>
        </div>

        <section
          aria-label="About me"
          style={{ ...card, marginTop: 24, padding: isMobile ? 24 : 32 }}
        >
          <h2 style={{ ...heading, fontSize: 22, marginBottom: 8 }}>
            About me
          </h2>
          <div
            style={{
              display: "grid",
              gap: 12,
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 680,
            }}
          >
            <p>
              I started my career as an architect, designing prefab homes on
              Marmol Radziner&apos;s prefab team from 2004 to 2006. From 2015
              to 2018 I worked in sales at Connect Homes, which was co-founded
              by members of that team, helping buyers understand what a modular
              home would cost and take to build. In 2020 I moved into web
              development.
            </p>
            <p>
              I build with AI coding tools like Claude Code, which you&apos;ll
              see credited in the commit history. I decide what to build and
              how it should work, and I own the result. The tools let me spend
              more of my time on what they can&apos;t do: knowing how modular
              homes are designed, sold and built.
            </p>
            <p>
              ModHomes brings those together: homes designed the way a factory
              builds them, priced the way buyers ask about them, in a browser.
            </p>
            <p style={{ fontSize: 14 }}>
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "underline" }}
              >
                More about me at gavingrant.com
              </a>{" "}
              ·{" "}
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "underline" }}
              >
                LinkedIn
              </a>
            </p>
          </div>
        </section>

        <section
          aria-label="Get in touch"
          style={{ ...card, marginTop: 24, padding: isMobile ? 24 : 32 }}
        >
          <h2 style={{ ...heading, fontSize: 22, marginBottom: 8 }}>
            Let&apos;s talk
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 620 }}>
            Whether you&apos;d like this built for your homes, or want someone
            on your team who can build it, email me at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              style={{ fontWeight: 600, textDecoration: "underline" }}
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 16 }}>
            <a
              href={FULL_VERSION_URL}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline" }}
            >
              Read the full version
            </a>
            , with how it fits your tools, what it costs to run, and what it
            can&apos;t promise. Or{" "}
            <a
              href={HOW_ITS_BUILT_URL}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline" }}
            >
              see how it&apos;s built
            </a>
            .
          </p>
        </section>
        <Footer pinned={false} />
      </div>
    </>
  );
};

export default Builders;
