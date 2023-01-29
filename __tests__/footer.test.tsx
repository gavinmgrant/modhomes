import React from "react";
import Footer from "../components/footer";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("Footer", () => {
  it("renders footer text and a GitHub icon", () => {
    const { getByText, getByTestId } = render(<Footer />);
    expect(getByText("Built by Gavin Grant")).toBeInTheDocument();
    expect(getByTestId("GitHubIcon")).toBeInTheDocument();
  });
});
