import React from "react";
import ModelCard, {
  formatPrice,
  getSpecs,
  getSummary,
} from "../components/modelcard";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";

// jsdom has no matchMedia, so the card lays out for a phone unless a test
// gives it a wide screen
const setWide = (wide: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: wide && query === "(min-width:600px)",
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

const FULL = {
  name: "Mod 2x1",
  area: 640,
  bedrooms: 1,
  baths: 1.5,
  footprint: [16, 40] as [number, number],
  price: 189000,
};

describe("ModelCard", () => {
  beforeEach(() => setWide(true));

  it("shows the model's name and floor area", () => {
    const { getByRole, getByText } = render(
      <ModelCard model={{ name: "Mod 2x2", area: 1280 }} />
    );
    expect(getByRole("heading", { name: "Mod 2x2" })).toBeInTheDocument();
    expect(getByText("sq ft")).toBeInTheDocument();
  });

  it("lists only the details a model has, and not the price", () => {
    expect(getSpecs({ name: "Mod 1x1", area: 320 }).map((s) => s.label)).toEqual(
      ["sq ft"]
    );
    expect(getSpecs(FULL).map((s) => s.label)).toEqual([
      "sq ft",
      "bed",
      "baths",
      "footprint",
    ]);
  });

  it("shows bedrooms, baths, footprint and price once they're known", () => {
    const { getByText } = render(<ModelCard model={FULL} />);
    expect(getByText("bed")).toBeInTheDocument();
    expect(getByText("1.5")).toBeInTheDocument();
    expect(getByText("baths")).toBeInTheDocument();
    expect(getByText("16′ × 40′")).toBeInTheDocument();
    expect(getByText("Your price")).toBeInTheDocument();
  });

  it("gives the price in full dollars, so a small upcharge still shows", () => {
    expect(formatPrice(525066)).toBe("$525,066");
    expect(formatPrice(526665.4)).toBe("$526,665");
  });

  it("links Reserve to the checkout it's given, and has none without one", () => {
    const href = "/homes/mod2x2/checkout?floor=concrete";
    const { getByRole, queryByRole, rerender } = render(
      <ModelCard model={{ name: "Mod 2x2", area: 1280 }} reserveHref={href} />
    );
    expect(getByRole("link", { name: "Reserve" })).toHaveAttribute("href", href);
    rerender(<ModelCard model={{ name: "Mod 2x2", area: 1280 }} />);
    expect(queryByRole("link", { name: "Reserve" })).toBeNull();
  });

  it("puts Reserve after the details, next to the price, with an arrow", () => {
    const { getByRole, getByText, getByTestId } = render(
      <ModelCard model={FULL} reserveHref="/homes/mod2x1/checkout" />
    );
    const reserve = getByRole("link", { name: "Reserve" });
    const price = getByText("Your price");
    expect(
      getByText("footprint").compareDocumentPosition(reserve) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    // in the same row as the price
    expect(price.parentElement!.parentElement).toContainElement(reserve);
    expect(reserve).toContainElement(getByTestId("ArrowForwardIcon"));
  });

  it("has no toggle on a wide screen", () => {
    const { queryByRole } = render(<ModelCard model={FULL} />);
    expect(queryByRole("button")).toBeNull();
  });
});

describe("ModelCard on a phone", () => {
  beforeEach(() => setWide(false));

  it("sums up beds and baths, or the floor area without them", () => {
    expect(getSummary(FULL)).toBe("1 bd · 1.5 ba");
    expect(getSummary({ name: "Mod 3x2", area: 1920 })).toBe("1,920 sq ft");
  });

  it("starts closed, to the name, price and Reserve", () => {
    const { getByRole, getByText, queryByText } = render(
      <ModelCard model={FULL} reserveHref="/homes/mod2x1/checkout" />
    );
    const toggle = getByRole("button", { name: "1 bd · 1.5 ba" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(queryByText("footprint")).toBeNull();
    expect(getByRole("heading", { name: "Mod 2x1" })).toBeInTheDocument();
    expect(getByText("Your price")).toBeInTheDocument();
    expect(getByRole("link", { name: "Reserve" })).toBeInTheDocument();
  });

  it("opens to the details from anywhere on its header, and closes again", () => {
    const { getByRole, getByText, queryByText } = render(
      <ModelCard model={FULL} reserveHref="/homes/mod2x1/checkout" />
    );
    const toggle = getByRole("button");
    fireEvent.click(getByRole("heading", { name: "Mod 2x1" }));
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const details = getByText("footprint").closest("dl")!;
    expect(toggle).toHaveAttribute("aria-controls", details.id);
    // still with the price and Reserve under them
    expect(getByRole("link", { name: "Reserve" })).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(queryByText("footprint")).toBeNull();
  });
});
