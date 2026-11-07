import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SiteAddress } from "../components/sitemap";

const site = {
  label: "A field",
  lat: 37.8,
  lng: -122.4,
  height: 10,
  heading: 0,
};

describe("SiteAddress", () => {
  it("names the lot and gives its coordinates while the site shows", () => {
    const { getByRole, getByText } = render(<SiteAddress shown site={site} />);
    expect(getByRole("region", { name: "Site" })).toBeInTheDocument();
    expect(getByText("A field")).toBeInTheDocument();
    expect(getByText("37.8000° N, 122.4000° W")).toBeInTheDocument();
  });

  it("isn't there otherwise", () => {
    const { queryByRole } = render(<SiteAddress shown={false} site={site} />);
    expect(queryByRole("region", { name: "Site" })).not.toBeInTheDocument();
  });
});
