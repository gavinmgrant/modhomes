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

  it("opens menu on click", () => {
    render(<NavBar />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByText("Mod 1x1"));
    expect(screen.getByText("Mod 2x1"));
    expect(screen.getByText("Mod 3x1"));
    expect(screen.getByText("Mod 4x1"));
  });
});
