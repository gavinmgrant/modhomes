import React from "react";
import LandingHero from "../components/landinghero";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// mock the ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe("LandingHero", () => {
  let handleScroll: () => void;

  beforeEach(() => {
    handleScroll = jest.fn();
  });

  it("should render the landing hero text", () => {
    const { getByText } = render(<LandingHero handleScroll={handleScroll} />);
    expect(getByText("Modern, modular homes.")).toBeInTheDocument();
  });

  it("should call the handleScroll function when the button is clicked", () => {
    const { getByText } = render(<LandingHero handleScroll={handleScroll} />);
    const button = getByText("Select a model");
    fireEvent.click(button);
    expect(handleScroll).toHaveBeenCalled();
  });
});
