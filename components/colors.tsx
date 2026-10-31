import React from "react";
import SwatchPicker from "./swatchpicker";

export const COLORS = {
  white: "#e3d7c4",
  taupe: "#a19b87",
  copper: "#554a3d",
  grey: "#94948b",
  roof: "#faf9f6",
  foundation: "#9b9998",
  shadow: "#696969",
  ground: "#dbd9d9",
  gyp: "#faf9f6",
  frame: "#2b2c2c",
  // Statuary Bronze, the default window and door trim
  trim: "#1c1b1a",
  // The inside of the floor band's reveal, which reads as a shadow line
  reveal: "#121313",
  glass: "#d6e6ec",
  tread: "#c49a6c",
  cable: "#a9adb1",
  // Kitchen and bathroom finishes in the services module
  walnut: "#5a4130",
  quartz: "#f1efea",
  stainless: "#b8bcbf",
  porcelain: "#f7f6f2",
  // Daltile Color Wheel's Matte Urban Putty, the default wall tile
  tile: "#cbbdaa",
  mirror: "#dfe3e5",
  cooktop: "#1c1d1e",
  grout: "#7d8184",
  // Cedar siding where the two-wide homes' bath walls off the glass
  siding: "#8c6240",
  // The counter stools' plywood shell edge and steel base
  plywood: "#c9a67c",
  blackSteel: "#232425",
};

const swatches = (colors: Record<string, string>) =>
  Object.entries(colors).map(([name, color]) => ({
    name,
    background: color,
    value: color,
  }));

// The metal siding, and the wood siding on homes that have it
export const METAL_OPTIONS = swatches({
  White: COLORS.white,
  Taupe: COLORS.taupe,
  Copper: COLORS.copper,
  Grey: COLORS.grey,
});

// The metal trim around the windows and doors
export const TRIM_OPTIONS = swatches({
  "Bone White": "#e6e1e0",
  "Charcoal Gray": "#30313c",
  "Fashion Gray": "#878d99",
  "Statuary Bronze": COLORS.trim,
});

export const WOOD_OPTIONS = swatches({
  Natural: "#b08d68",
  Cedar: COLORS.siding,
  Walnut: "#5e4330",
  Espresso: "#3a2c24",
});

interface ColorProps {
  homeColor: string;
  handleColor: (color: string) => void;
  trimColor: string;
  handleTrimColor: (color: string) => void;
  sidingColor: string;
  handleSidingColor: (color: string) => void;
  hasWood: boolean;
}

const Colors = ({
  homeColor,
  handleColor,
  trimColor,
  handleTrimColor,
  sidingColor,
  handleSidingColor,
  hasWood,
}: ColorProps) => (
  <>
    <SwatchPicker
      label="Panels"
      options={METAL_OPTIONS}
      value={homeColor}
      onChange={handleColor}
    />
    <SwatchPicker
      label="Trim"
      options={TRIM_OPTIONS}
      value={trimColor}
      onChange={handleTrimColor}
    />
    {hasWood && (
      <SwatchPicker
        label="Wood"
        options={WOOD_OPTIONS}
        value={sidingColor}
        onChange={handleSidingColor}
      />
    )}
  </>
);

export default Colors;
