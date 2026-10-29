import React from "react";
import Swatch from "./swatch";

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
  // The inside of the floor band's reveal, which reads as a shadow line
  reveal: "#121313",
  glass: "#d6e6ec",
  tread: "#c49a6c",
  cable: "#a9adb1",
};

const OPTIONS = [
  { name: "White", color: COLORS.white },
  { name: "Taupe", color: COLORS.taupe },
  { name: "Copper", color: COLORS.copper },
  { name: "Grey", color: COLORS.grey },
];

interface ColorProps {
  homeColor: string;
  handleColor: (color: string) => void;
}

const Colors = ({ homeColor, handleColor }: ColorProps) => (
  <>
    {OPTIONS.map(({ name, color }) => (
      <Swatch
        key={name}
        name={name}
        background={color}
        selected={homeColor === color}
        onSelect={() => handleColor(color)}
      />
    ))}
  </>
);

export default Colors;
