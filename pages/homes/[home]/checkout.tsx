import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { GetServerSideProps } from "next";
import Dialog from "@mui/material/Dialog";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import NavBar from "../../../components/navbar";
import Footer from "../../../components/footer";
import PageMeta from "../../../components/pagemeta";
import { OrderBreakdown, Schedule } from "../../../components/checkout";
import {
  INK,
  ink,
  PAPER,
  PANEL,
  PANEL_RADIUS,
} from "../../../components/panel";
import { findModel, Model } from "../../../lib/models";
import {
  Configuration,
  getConfigPath,
  getFinishNames,
  parseConfig,
} from "../../../lib/homeconfig";
import {
  DEPOSIT_RATE,
  FACTORY,
  formatDate,
  getOrder,
  getRoadMiles,
  getSchedule,
  Milestone,
} from "../../../lib/delivery";
import { PRICE } from "../../../lib/pricing";
import { SITE } from "../../../lib/site";
import { useIsMobile } from "../../../lib/media";

// The checkout for a home as configured: what it's built from and what it
// costs, its delivery from the factory to the lot and its set there, and
// when it would all happen. It's a concept, so reserving takes no payment
// and keeps nothing: it opens a confirmation, and that's all

type CheckoutProps = {
  slug: string;
  config: Configuration;
  // From the day it's opened, worked out on the server so the page's HTML
  // and the browser agree
  schedule: Milestone[];
};

// Rendered for each request, so the home in the URL's query is in the
// page's HTML from the start
export const getServerSideProps: GetServerSideProps<CheckoutProps> = async ({
  params,
  query,
}) => {
  const slug = String(params?.home);
  const model = findModel(slug);
  if (!model) return { notFound: true };
  return {
    props: {
      slug,
      config: parseConfig(query),
      schedule: getSchedule(model.cols, model.stories, new Date()),
    },
  };
};

const NUMBER = new Intl.NumberFormat("en-US");

const describe = ({ area, cols, stories }: Model) => {
  const modules = cols * stories;
  return [
    `${NUMBER.format(area)} sq ft`,
    stories === 2 ? "Two stories" : "One story",
    `${modules} ${modules === 1 ? "module" : "modules"}`,
  ].join(" · ");
};

const FINISH_LABELS = {
  metal: "Metal siding",
  trim: "Trim",
  wood: "Wood",
  floor: "Floor",
  tile: "Wall tile",
};

// e.g. "Left side", "Both sides" or "None"
const describeDecks = ({ decks }: Configuration) => {
  const [left, right] = [decks[-1], decks[1]].map(Boolean);
  if (left && right) return "Both sides";
  return left ? "Left side" : right ? "Right side" : "None";
};

// e.g. "MH-4K7Q2D", made up when reserving
const makeOrderNumber = () =>
  `MH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const card = {
  ...PANEL,
  borderRadius: PANEL_RADIUS,
  padding: "20px 24px",
};

const heading = { fontSize: 18, fontWeight: 600, marginBottom: 8 };

const button = {
  display: "block",
  width: "100%",
  textAlign: "center" as const,
  borderRadius: 999,
  padding: "12px 20px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const Checkout = ({ slug, config, schedule }: CheckoutProps) => {
  const isMobile = useIsMobile();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // The paths are the models, and the server checked this one
  const model = findModel(slug)!;
  const { cols, stories } = model;
  const order = getOrder({ cols, stories, ...config });
  const configured = getConfigPath(slug, config);

  // Reserves once, and confirms it over the page
  const reserve = () => {
    setOrderNumber(makeOrderNumber());
    setConfirming(true);
  };

  return (
    <>
      <PageMeta
        title={`Reserve your ${model.name} | ModHomes`}
        description={`The price of a ${model.name} as configured, with its delivery and set, and when it would be ready.`}
        path={`/homes/${slug}/checkout`}
        image={`/og/${slug}.png`}
        imageAlt={`3D render of the ${model.name} modular home`}
        noindex
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
        <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 600 }}>
          Reserve your home
        </h1>
        <p style={{ opacity: 0.7, marginTop: 4, marginBottom: 24 }}>
          A concept only: no payment is taken, and nothing is ordered.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "5fr 7fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 24 }}>
            <section aria-label="Your home" style={card}>
              <Image
                src={`/og/${slug}.png`}
                alt={`3D render of the ${model.name}`}
                width={1200}
                height={630}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 12,
                  background: ink(0.04),
                }}
                priority
              />
              <h2 style={{ ...heading, marginTop: 16, marginBottom: 2 }}>
                {model.name}
              </h2>
              <p style={{ fontSize: 14, opacity: 0.7 }}>{describe(model)}</p>
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  columnGap: 16,
                  rowGap: 4,
                  marginTop: 16,
                  fontSize: 14,
                }}
              >
                {getFinishNames(config.finishes).map(({ key, name }) => (
                  <React.Fragment key={key}>
                    <dt style={{ opacity: 0.6 }}>{FINISH_LABELS[key]}</dt>
                    <dd>{name}</dd>
                  </React.Fragment>
                ))}
                <dt style={{ opacity: 0.6 }}>Decks</dt>
                <dd>{describeDecks(config)}</dd>
              </dl>
              <Link
                href={configured}
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Change this home
              </Link>
            </section>
            <section aria-label="Delivery" style={card}>
              <h2 style={heading}>Delivery and set</h2>
              <p style={{ fontSize: 14, lineHeight: 1.5 }}>
                Built at the {FACTORY.label}, trucked {getRoadMiles()} miles to{" "}
                {SITE.label}, and set on its foundation by crane.
              </p>
              <h3
                style={{ fontSize: 14, fontWeight: 600, margin: "16px 0 4px" }}
              >
                Schedule
              </h3>
              <Schedule milestones={schedule} />
            </section>
          </div>

          <section aria-label="Price" style={card}>
            <h2 style={heading}>Price</h2>
            <OrderBreakdown order={order} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                margin: "4px 0 16px",
              }}
            >
              <span>Due today, a {DEPOSIT_RATE * 100}% deposit</span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                {PRICE.format(order.deposit)}
              </strong>
            </div>
            {orderNumber ? (
              // Once it's reserved, the button reopens the confirmation
              <button
                type="button"
                onClick={() => setConfirming(true)}
                style={{
                  ...button,
                  border: `1px solid ${ink(0.2)}`,
                  background: "transparent",
                  color: INK,
                }}
              >
                Reserved · Order {orderNumber}
              </button>
            ) : (
              <button
                type="button"
                onClick={reserve}
                style={{
                  ...button,
                  border: "none",
                  background: INK,
                  color: PAPER,
                }}
              >
                Reserve for {PRICE.format(order.deposit)}
              </button>
            )}
          </section>
        </div>
        <Footer pinned={false} />
      </div>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        aria-labelledby="reserved-title"
        aria-describedby="reserved-detail"
        PaperProps={{
          sx: {
            background: PAPER,
            color: INK,
            borderRadius: `${PANEL_RADIUS}px`,
            padding: isMobile ? "24px 20px 20px" : "32px 32px 28px",
            maxWidth: 440,
            textAlign: "center",
          },
        }}
      >
        <CheckCircleOutlineIcon
          aria-hidden
          sx={{ fontSize: 48, margin: "0 auto 12px" }}
        />
        <h2 id="reserved-title" style={{ ...heading, fontSize: 22 }}>
          Your {model.name} is reserved
        </h2>
        <p
          id="reserved-detail"
          style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.8 }}
        >
          Order <strong>{orderNumber}</strong>. Your{" "}
          {PRICE.format(order.deposit)} deposit holds a build slot starting{" "}
          {formatDate(schedule[1].date)}, and it would be ready to move in by{" "}
          {formatDate(schedule[schedule.length - 1].date)}.
        </p>
        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 12 }}>
          A concept only: in a real checkout, the payment would go through here.
        </p>
        <div style={{ display: "grid", gap: 8, marginTop: 24 }}>
          <Link
            href={configured}
            style={{ ...button, background: INK, color: PAPER }}
          >
            Back to your home
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            style={{
              ...button,
              border: `1px solid ${ink(0.2)}`,
              background: "transparent",
              color: INK,
            }}
          >
            Close
          </button>
        </div>
      </Dialog>
    </>
  );
};

export default Checkout;
