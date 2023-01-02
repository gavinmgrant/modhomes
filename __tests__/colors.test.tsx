import React from "react";
import Colors from "../components/colors";
import { render, fireEvent } from "@testing-library/react";

describe("colors", () => {
  it("renders the correct number of color options", () => {
    const { getAllByRole } = render(
      <Colors homeColor="#e3d7c4" handleColor={() => {}} />
    );
    const colorOptions = getAllByRole("tooltip")
    expect(colorOptions).toHaveLength(4);
  });

  it("updates the homeColor prop when a color option is selected", () => {
    const handleColor = jest.fn();
    const { getByTestId } = render(
      <Colors homeColor="#e3d7c4" handleColor={handleColor} />
    );
    const taupeOption = getByTestId("taupe-option");
    fireEvent.click(taupeOption);
    expect(handleColor).toHaveBeenCalledWith("#a19b87");
  });
});
