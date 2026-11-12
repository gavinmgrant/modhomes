import * as React from "react";
import NavBar from "../components/navbar";
import singletonRouter from "next/router";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import mockRouter from "next-router-mock";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("next/dist/client/router", () => require("next-router-mock"));

describe("nav bar", () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl("/");
  });
  afterEach(cleanup);

  it("supports `push` method to mod page", () => {
    singletonRouter.push("/homes/mod1x1");
    expect(singletonRouter).toMatchObject({
      asPath: "/homes/mod1x1",
    });
  });

  it("renders ModHomes title", () => {
    const { getByText } = render(<NavBar />);
    expect(getByText("ModHomes")).toBeTruthy();
  });

  it("brings the finishes and decks picked along to another model", () => {
    mockRouter.setCurrentUrl("/homes/mod3x2?metal=copper&decks=left");
    render(<NavBar />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Mod 2x2"));
    expect(mockRouter.asPath).toBe("/homes/mod2x2?metal=copper&decks=left");
  });

  it("opens a plain model from the landing page", () => {
    render(<NavBar />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Mod 2x2"));
    expect(mockRouter.asPath).toBe("/homes/mod2x2");
  });

  it("opens the builders page from the menu", () => {
    mockRouter.setCurrentUrl("/homes/mod3x2?metal=copper");
    render(<NavBar />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("For builders"));
    expect(mockRouter.asPath).toBe("/builders");
  });

  it("opens menu on click", () => {
    render(<NavBar />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Mod 1x1"));
    expect(screen.getByText("Mod 2x1"));
    expect(screen.getByText("Mod 3x1"));
    expect(screen.getByText("Mod 4x1"));
  });
});
