import React from "react";
import Module from "./module";
import EndWall from "./endwall";
import Foundation from "./foundation";
import Roof from "./roof";
import SlidingDoors from "./slidingdoors";
import { COLORS } from "./colors";

// "mod3x2" -> 3 modules wide, 2 stories; null until the slug is known
export const parseModel = (slug?: string | string[]) => {
  const match = typeof slug === "string" ? slug.match(/^mod(\d)x(\d)$/) : null;
  return match ? { cols: Number(match[1]), stories: Number(match[2]) } : null;
};

// Bottom of the foundation, where the model meets the ground
export const MODEL_BASE = -6.45;

// Outer size of the built model, from the foundation base to the end wall tops
export const getModelSize = (cols: number, stories: number) => {
  const bottom = MODEL_BASE;
  const top = stories === 2 ? 16.5 : 6.5;
  return {
    width: 8 * cols + 1.2,
    depth: 40.6,
    height: top - bottom,
    centerY: (top + bottom) / 2,
  };
};

interface HomeModelProps {
  cols: number;
  stories: number;
  color: string;
  floorMaterial: string;
  envelopeOn?: boolean;
}

// Modules are 8 wide and sit side by side centred on x = 0; upper stories are 10 up
const HomeModel = ({
  cols,
  stories,
  color,
  floorMaterial,
  envelopeOn = true,
}: HomeModelProps) => {
  const twoStory = stories === 2;
  const halfWidth = 4 * cols;
  const modules = [];
  for (let story = 0; story < stories; story++) {
    for (let i = 0; i < cols; i++) {
      modules.push([-halfWidth + 4 + 8 * i, 10 * story, 0]);
    }
  }

  return (
    <>
      {envelopeOn && (
        <EndWall
          position={[-(halfWidth - 0.5), 0, 0]}
          color={color}
          rotate={false}
          twoStory={twoStory}
        />
      )}
      {modules.map((position) => (
        <Module
          key={position.join()}
          position={position}
          color={color}
          envelopeOn={envelopeOn}
          floorMaterial={floorMaterial}
        />
      ))}
      {envelopeOn && (
        <EndWall
          position={[halfWidth - 0.5, 0, 0]}
          color={color}
          rotate
          twoStory={twoStory}
        />
      )}
      {envelopeOn && (
        <>
          <SlidingDoors side={-1} halfWidth={halfWidth} stories={stories} />
          <SlidingDoors side={1} halfWidth={halfWidth} stories={stories} />
        </>
      )}
      <Foundation
        position={[0, -5.7, 0]}
        color={COLORS.foundation}
        width={8 * cols - 1}
      />
      <Roof
        position={[0, twoStory ? 15.3 : 5.3, 0]}
        color={COLORS.roof}
        width={8 * cols - 1}
      />
    </>
  );
};

export default HomeModel;
