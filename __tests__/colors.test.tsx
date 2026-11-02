import React from "react";
import Colors, {
  COLORS,
  METAL_OPTIONS,
  TRIM_OPTIONS,
  WOOD_OPTIONS,
} from "../components/colors";
import Materials, {
  getFloorRepeat,
  TILE_OPTIONS,
} from "../components/materials";
import { render, fireEvent } from "@testing-library/react";

const renderColors = (
  hasWood: boolean,
  handleColor = jest.fn(),
  handleTrimColor = jest.fn(),
) =>
  render(
    <Colors
      homeColor={COLORS.white}
      handleColor={handleColor}
      trimColor={COLORS.trim}
      handleTrimColor={handleTrimColor}
      sidingColor={COLORS.siding}
      handleSidingColor={() => {}}
      hasWood={hasWood}
    />,
  );

describe("colors", () => {
  it("offers four colors each for the metal siding, trim and wood siding", () => {
    expect(METAL_OPTIONS).toHaveLength(4);
    expect(TRIM_OPTIONS).toHaveLength(4);
    expect(WOOD_OPTIONS).toHaveLength(4);
    expect(TILE_OPTIONS).toHaveLength(4);
  });

  it("starts with one swatch per finish, showing the current choice", () => {
    const { getAllByRole, getByLabelText } = renderColors(true);
    expect(getAllByRole("button")).toHaveLength(3);
    expect(getByLabelText("Metal: White")).toBeTruthy();
    expect(getByLabelText("Trim: Statuary Bronze")).toBeTruthy();
    expect(getByLabelText("Wood: Cedar")).toBeTruthy();
  });

  it("leaves out the wood swatch on homes without wood siding", () => {
    const { getAllByRole } = renderColors(false);
    expect(getAllByRole("button")).toHaveLength(2);
  });

  it("picks a trim color from its own swatch", () => {
    const handleTrimColor = jest.fn();
    const { getByLabelText, getByTestId } = renderColors(
      true,
      jest.fn(),
      handleTrimColor,
    );
    fireEvent.click(getByLabelText("Trim: Statuary Bronze"));
    fireEvent.click(getByTestId("bone white-option"));
    expect(handleTrimColor).toHaveBeenCalledWith(
      TRIM_OPTIONS.find(({ name }) => name === "Bone White")?.value,
    );
  });

  it("opens the options above a swatch and closes once one is picked", () => {
    const handleColor = jest.fn();
    const { getByLabelText, getByTestId, queryByRole } = renderColors(
      true,
      handleColor,
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
  it("tiles concrete and carpet in their images' proportions, but stretches wood boards", () => {
    // concrete's image is 2:1, carpet's square
    (
      [
        ["concrete", 2],
        ["carpet", 1],
      ] as const
    ).forEach(([material, aspect]) => {
      const [u, v] = getFloorRepeat(material);
      expect(39 / u).toBeCloseTo(aspect * (8 / v));
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
      />,
    );
    expect(getByLabelText("Floor: Walnut")).toBeTruthy();
    fireEvent.click(getByLabelText("Tile: Urban Putty"));
    fireEvent.click(getByTestId("chalkboard-option"));
    expect(handleTileColor).toHaveBeenCalledWith("#575b5e");
  });
});
