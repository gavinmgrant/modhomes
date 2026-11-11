import React from "react";
import ModelCard, { getSpecs } from "../components/modelcard";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("ModelCard", () => {
  it("shows the model's name and floor area", () => {
    const { getByRole, getByText } = render(
      <ModelCard model={{ name: "Mod 2x2", area: 1280 }} />
    );
    expect(getByRole("heading", { name: "Mod 2x2" })).toBeInTheDocument();
    expect(getByText("sq ft")).toBeInTheDocument();
  });

  it("lists only the details a model has", () => {
    expect(getSpecs({ name: "Mod 1x1", area: 320 }).map((s) => s.label)).toEqual(
      ["sq ft"]
    );
  });

  it("shows bedrooms, baths, footprint and price once they're known", () => {
    const { getByText } = render(
      <ModelCard
        model={{
          name: "Mod 2x1",
          area: 640,
          bedrooms: 1,
          baths: 1.5,
          footprint: [16, 40],
          price: 189000,
        }}
      />
    );
    expect(getByText("bed")).toBeInTheDocument();
    expect(getByText("1.5")).toBeInTheDocument();
    expect(getByText("baths")).toBeInTheDocument();
    expect(getByText("16′ × 40′")).toBeInTheDocument();
    expect(getByText("price")).toBeInTheDocument();
  });

  it("gives the price in full dollars, so a small upcharge still shows", () => {
    const price = getSpecs({ name: "Mod 2x2", area: 1280, price: 525066 })
      .find(({ label }) => label === "price")!;
    expect(price.format!(525066)).toBe("$525,066");
    expect(price.format!(526665.4)).toBe("$526,665");
  });
});
