import React, { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useMediaQuery } from "@mui/material";
import { motion, useSpring, useTransform } from "framer-motion";
import { INK, PANEL, PANEL_RADIUS, PAPER, ink } from "./panel";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PRICE } from "../lib/pricing";
import { useIsTouch } from "../lib/media";

// What the card knows about a model. Floor area is all every model has;
// the model page adds its footprint and its price as configured, and the
// rest show up on the card as lib/models.ts gains them.
export interface ModelFacts {
  name: string;
  area: number;
  bedrooms?: number;
  baths?: number;
  // starting price, in dollars
  price?: number;
  // width and length, in feet
  footprint?: [number, number];
}

interface Spec {
  label: string;
  // numbers count up from zero when the card appears, strings show as they are
  value: number | string;
  format?: (value: number) => string;
}

const NUMBER = new Intl.NumberFormat("en-US");

const plural = (count: number, word: string) =>
  count === 1 ? word : `${word}s`;

// The details listed on the card. The price isn't one: it has a row of its
// own, next to Reserve
export const getSpecs = (model: ModelFacts): Spec[] => {
  const specs: Spec[] = [{ label: "sq ft", value: model.area }];
  if (model.bedrooms !== undefined) {
    specs.push({
      label: plural(model.bedrooms, "bed"),
      value: NUMBER.format(model.bedrooms),
    });
  }
  if (model.baths !== undefined) {
    specs.push({
      label: plural(model.baths, "bath"),
      value: NUMBER.format(model.baths),
    });
  }
  if (model.footprint) {
    const [width, length] = model.footprint;
    specs.push({ label: "footprint", value: `${width}′ × ${length}′` });
  }
  return specs;
};

// What the collapsed card says of its details on a phone: beds and baths
// when the model has them, otherwise its floor area
export const getSummary = (model: ModelFacts) =>
  model.bedrooms !== undefined && model.baths !== undefined
    ? `${NUMBER.format(model.bedrooms)} bd · ${NUMBER.format(model.baths)} ba`
    : `${NUMBER.format(model.area)} sq ft`;

// In full dollars, so every finish and deck moves it, counting up or down
export const formatPrice = (value: number) => PRICE.format(Math.round(value));

const CountUp = ({
  value,
  format = (value) => NUMBER.format(Math.floor(value)),
}: {
  value: number;
  format?: (value: number) => string;
}) => {
  // starts at zero and eases to the value, slow and without overshoot (the
  // stiffness and damping of React Spring's "molasses", which it used before)
  const count = useSpring(0, { stiffness: 280, damping: 120 });
  const text = useTransform(count, format);
  useEffect(() => count.set(value), [count, value]);
  return <motion.span>{text}</motion.span>;
};

interface ModelCardProps {
  model: ModelFacts;
  // Where its Reserve button goes: the checkout for the home as configured
  reserveHref?: string;
}

const ModelCard = ({ model, reserveHref }: ModelCardProps) => {
  // MUI's toolbar is 64px tall from 600px up, 56px below that
  const isWide = useMediaQuery("(min-width:600px)");
  const isTouch = useIsTouch();
  // On a phone the card starts closed, to the name, price and Reserve, and
  // its header opens it to the details. From 600px up it's always open
  const [isOpen, setIsOpen] = useState(false);
  const showSpecs = isWide || isOpen;
  const specsId = useId();
  const hasPriceRow = model.price !== undefined || Boolean(reserveHref);

  const heading = (
    <h1
      style={{
        margin: 0,
        fontSize: isWide ? 15 : 14,
        fontWeight: 600,
        lineHeight: 1.3,
      }}
    >
      {model.name}
    </h1>
  );

  return (
    <section
      aria-label={`${model.name} details`}
      style={{
        ...PANEL,
        position: "absolute",
        // the canvas comes later in the page, so lift the card above it
        zIndex: 10,
        // sits just under the navbar (16px offset + toolbar height)
        top: isWide ? 92 : 84,
        left: 16,
        maxWidth: "calc(100% - 32px)",
        padding: isWide ? "10px 18px 12px" : "8px 14px 10px",
        borderRadius: PANEL_RADIUS,
      }}
    >
      {isWide ? (
        heading
      ) : (
        // The whole header opens and closes the card; the button is what
        // takes focus and tells a screen reader whether it's open
        <div
          onClick={() => setIsOpen((open) => !open)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            cursor: "pointer",
          }}
        >
          {heading}
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={specsId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              // a bigger target than it looks, without moving the header
              margin: "-8px -8px -8px 0",
              padding: "8px 4px 8px 8px",
              border: 0,
              background: "none",
              color: "inherit",
              font: "inherit",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <span style={{ opacity: 0.6 }}>{getSummary(model)}</span>
            {isOpen ? (
              <ExpandLessIcon aria-hidden sx={{ fontSize: 20 }} />
            ) : (
              <ExpandMoreIcon aria-hidden sx={{ fontSize: 20 }} />
            )}
          </button>
        </div>
      )}
      {showSpecs && (
        <dl
          id={specsId}
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: isWide ? 24 : 18,
            rowGap: 6,
            margin: "6px 0 0",
          }}
        >
          {getSpecs(model).map(({ label, value, format }) => (
            // the label reads first, but sits under its value
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column-reverse" }}
            >
              <dt style={{ fontSize: 12, lineHeight: 1.3, opacity: 0.6 }}>
                {label}
              </dt>
              <dd
                style={{
                  margin: 0,
                  fontSize: isWide ? 18 : 16,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {typeof value === "number" ? (
                  <CountUp value={value} format={format} />
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {hasPriceRow && (
        // The price and the button that acts on it, side by side under a
        // rule. The button keeps one size however wide the details make
        // the card, and neither hides when the card is closed
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            marginTop: isWide ? 10 : 8,
            paddingTop: isWide ? 10 : 8,
            borderTop: `1px solid ${ink(0.12)}`,
          }}
        >
          {model.price !== undefined && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 12, lineHeight: 1.3, opacity: 0.6 }}>
                Your price
              </span>
              <span
                style={{
                  fontSize: isWide ? 22 : 19,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <CountUp value={model.price} format={formatPrice} />
              </span>
            </div>
          )}
          {reserveHref && (
            // 44px tall on touch screens, for a thumb
            <Link
              href={reserveHref}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                marginLeft: "auto",
                padding: "0 16px",
                height: isTouch ? 44 : 36,
                borderRadius: 999,
                background: INK,
                color: PAPER,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Reserve
              <ArrowForwardIcon aria-hidden sx={{ fontSize: 18 }} />
            </Link>
          )}
        </div>
      )}
    </section>
  );
};

export default ModelCard;
