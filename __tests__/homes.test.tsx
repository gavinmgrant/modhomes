import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import mockRouter from "next-router-mock";
import Homes from "../pages/homes";
import MODELS from "../lib/models";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("next/dist/client/router", () => require("next-router-mock"));
// The cards' shared 3D canvas needs WebGL, which jsdom doesn't have
jest.mock("../components/modelpreviews", () => ({
  __esModule: true,
  default: () => null,
}));

// The cards fade in as they scroll into view, which jsdom can't tell, so
// nothing is ever reported in view
class NoIntersections {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.assign(window, { IntersectionObserver: NoIntersections });

describe("models page", () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl("/homes");
    window.localStorage.clear();
    render(<Homes />);
  });

  it("is headed by the models, as the page's own heading", () => {
    expect(
      screen.getByRole("heading", { level: 1, name: "Models" }),
    ).toBeInTheDocument();
  });

  it("shows a card for every model", () => {
    MODELS.forEach((model) =>
      expect(screen.getByText(model.name)).toBeInTheDocument(),
    );
  });

  it("opens a model from the outside when its card is picked", () => {
    window.localStorage.setItem("position", "inside");
    fireEvent.click(screen.getByText("Mod 2x2"));
    expect(mockRouter.asPath).toBe("/homes/mod2x2");
    expect(window.localStorage.getItem("position")).toBe("outside");
  });
});
