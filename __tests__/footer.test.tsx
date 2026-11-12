import React from "react";
import Footer from "../components/footer";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("Footer", () => {
  it("renders footer text and a GitHub icon", () => {
    const { getByText, getByTestId } = render(<Footer />);
    expect(getByText("Built by Gavin Grant")).toBeInTheDocument();
    expect(getByTestId("GitHubIcon")).toBeInTheDocument();
    expect(getByText(/is a demo for a made-up builder/)).toBeInTheDocument();
  });

  it("links builders to the page for them", () => {
    const { getByRole } = render(<Footer />);
    expect(getByRole("link", { name: "For builders" })).toHaveAttribute(
      "href",
      "/builders",
    );
  });

  it("pins itself to the bottom unless it's told to follow the page", () => {
    const { getByRole, rerender } = render(<Footer />);
    expect(getByRole("contentinfo")).not.toHaveStyle({ position: "static" });
    rerender(<Footer pinned={false} />);
    expect(getByRole("contentinfo")).toHaveStyle({ position: "static" });
  });
});
