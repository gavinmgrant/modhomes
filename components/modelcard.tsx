import React from "react";
import { useMediaQuery } from "@mui/material";
import { useSpring, animated, config } from "@react-spring/web";
import { PANEL, PANEL_RADIUS } from "./panel";

// What the card knows about a model. Floor area is all every model has so
// far; the rest show up on the card as lib/models.js gains them.
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
// e.g. $289K, $1.25M
const PRICE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumSignificantDigits: 3,
});

const plural = (count: number, word: string) =>
  count === 1 ? word : `${word}s`;

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
  if (model.price !== undefined) {
    specs.push({
      label: "price",
      value: model.price,
      format: (value) => PRICE.format(value),
    });
  }
  return specs;
};

const CountUp = ({
  value,
  format = (value) => NUMBER.format(Math.floor(value)),
}: {
  value: number;
  format?: (value: number) => string;
}) => {
  const count = useSpring({
    val: value,
    from: { val: 0 },
    config: config.molasses,
  });
  return <animated.span>{count.val.to(format)}</animated.span>;
};

const ModelCard = ({ model }: { model: ModelFacts }) => {
  // MUI's toolbar is 64px tall from 600px up, 56px below that
  const isWide = useMediaQuery("(min-width:600px)");

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
      <dl
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
    </section>
  );
};

export default ModelCard;
