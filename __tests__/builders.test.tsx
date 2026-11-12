import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import mockRouter from "next-router-mock";
import Builders, {
  CONTACT_EMAIL,
  DEMO_HOME,
  FULL_VERSION_URL,
  HOW_ITS_BUILT_URL,
} from "../pages/builders";
import { parseConfig } from "../lib/homeconfig";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("next/dist/client/router", () => require("next-router-mock"));

describe("builders page", () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl("/builders");
    render(<Builders />);
  });

  it("pitches the demo to builders", () => {
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Bring your homes to the browser",
      }),
    ).toBeInTheDocument();
    for (const name of [
      "What it could do for your sales",
      "What I'd need from you",
      "Built in phases",
      "Good to know",
    ]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
  });

  it("asks builders to email, from the top and the end", () => {
    expect(screen.getByRole("link", { name: "Email me" })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
    const contact = screen.getByRole("region", { name: "Get in touch" });
    expect(
      within(contact).getByRole("link", { name: CONTACT_EMAIL }),
    ).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
  });

  it("links to the full version and how it's built", () => {
    expect(
      screen.getByRole("link", { name: "Read the full version" }),
    ).toHaveAttribute("href", FULL_VERSION_URL);
    expect(
      screen.getByRole("link", { name: "see how it's built" }),
    ).toHaveAttribute("href", HOW_ITS_BUILT_URL);
    expect(FULL_VERSION_URL).toMatch(/docs\/FOR-BUILDERS\.md$/);
  });

  it("links to every model", () => {
    expect(
      screen.getByRole("link", { name: "Browse the models" }),
    ).toHaveAttribute("href", "/homes");
  });

  it("offers a configured home to try", () => {
    expect(screen.getByRole("link", { name: "Try a home" })).toHaveAttribute(
      "href",
      DEMO_HOME,
    );
    // the demo's query is one the viewer reads, with both decks
    const config = parseConfig(
      Object.fromEntries(new URLSearchParams(DEMO_HOME.split("?")[1])),
    );
    expect(Object.keys(config.decks)).toHaveLength(2);
  });
});
