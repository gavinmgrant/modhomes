import React from "react";
import Colors, {
  COLORS,
  METAL_OPTIONS,
  WOOD_OPTIONS,
} from "../components/colors";
import Materials, {
  getFloorRepeat,
  TILE_OPTIONS,
} from "../components/materials";
import { render, fireEvent } from "@testing-library/react";

const renderColors = (hasWood: boolean, handleColor = jest.fn()) =>
  render(
    <Colors
      homeColor={COLORS.white}
      handleColor={handleColor}
      sidingColor={COLORS.siding}
      handleSidingColor={() => {}}
      hasWood={hasWood}
    />
  );

describe("colors", () => {
  it("offers four colors each for the metal and wood siding", () => {
    expect(METAL_OPTIONS).toHaveLength(4);
    expect(WOOD_OPTIONS).toHaveLength(4);
    expect(TILE_OPTIONS).toHaveLength(4);
  });

  it("starts with one swatch per finish, showing the current choice", () => {
    const { getAllByRole, getByLabelText } = renderColors(true);
    expect(getAllByRole("button")).toHaveLength(2);
    expect(getByLabelText("Metal: White")).toBeTruthy();
    expect(getByLabelText("Wood: Cedar")).toBeTruthy();
  });

  it("leaves out the wood swatch on homes without wood siding", () => {
    const { getAllByRole } = renderColors(false);
    expect(getAllByRole("button")).toHaveLength(1);
  });

  it("opens the options above a swatch and closes once one is picked", () => {
    const handleColor = jest.fn();
    const { getByLabelText, getByTestId, queryByRole } = renderColors(
      true,
      handleColor
    );
    const metal = getByLabelText("Metal: White");
    expect(metal.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(metal);
    expect(metal.getAttribute("aria-expanded")).toBe("true");
    expect(queryByRole("group", { name: "Metal" })).toBeTruthy();
    fireEvent.click(getByTestId("taupe-option"));
    expect(handleColor).toHaveBeenCalledWith(COLORS.taupe);
    expect(metal.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes the options on Escape", () => {
    const { getByLabelText } = renderColors(true);
    const wood = getByLabelText("Wood: Cedar");
    fireEvent.click(wood);
    fireEvent.keyDown(wood, { key: "Escape" });
    expect(wood.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("materials", () => {
  it("tiles concrete and carpet in square tiles, but stretches wood boards", () => {
    (["concrete", "carpet"] as const).forEach((material) => {
      const [u, v] = getFloorRepeat(material);
      expect(39 / u).toBeCloseTo(8 / v);
    });
    expect(getFloorRepeat("walnut")).toEqual([1, 1]);
  });

  it("picks a wall tile color from its own swatch", () => {
    const handleTileColor = jest.fn();
    const { getByLabelText, getByTestId } = render(
      <Materials
        floorMaterial="walnut"
        handleFloorMaterial={() => {}}
        tileColor={COLORS.tile}
        handleTileColor={handleTileColor}
        hasTile
      />
    );
    expect(getByLabelText("Floor: Walnut")).toBeTruthy();
    fireEvent.click(getByLabelText("Tile: Urban Putty"));
    fireEvent.click(getByTestId("chalkboard-option"));
    expect(handleTileColor).toHaveBeenCalledWith("#575b5e");
  });
});
