import React from "react";
import Module from "./module";
import EndWall from "./endwall";
import Foundation from "./foundation";
import Roof from "./roof";
import SlidingDoors from "./slidingdoors";
import Stair, { getStairLayout } from "./stair";
import Services, { getSidedPanes } from "./services";
import { COLORS } from "./colors";

// "mod3x2" -> 3 modules wide, 2 stories; null until the slug is known
export const parseModel = (slug?: string | string[]) => {
  const match = typeof slug === "string" ? slug.match(/^mod(\d)x(\d)$/) : null;
  return match ? { cols: Number(match[1]), stories: Number(match[2]) } : null;
};

// Bottom of the foundation, where the model meets the ground
export const MODEL_BASE = -6.45;

// Top of the walls and the parapets they rise into around the roof
export const getParapetTop = (stories: number) => 10 * (stories - 1) + 6.5;

// Outer size of the built model, from the foundation base to the end wall tops
export const getModelSize = (cols: number, stories: number) => {
  const bottom = MODEL_BASE;
  const top = getParapetTop(stories);
  return {
    width: 8 * cols + 1.2,
    depth: 40.6,
    height: top - bottom,
    centerY: (top + bottom) / 2,
  };
};

// Closest the outside view may zoom to the model's centre, which Stage puts at
// the orbit target: just beyond the corners of its box, so the camera stops
// short of the home from any angle
const ORBIT_CLEARANCE = 2;

export const getOrbitMinDistance = (cols: number, stories: number) => {
  const { width, depth, height } = getModelSize(cols, stories);
  return Math.hypot(width, depth, height) / 2 + ORBIT_CLEARANCE;
};

interface HomeModelProps {
  cols: number;
  stories: number;
  color: string;
  floorMaterial: string;
  // The window and door trim's colour
  trimColor?: string;
  // The wood siding's and the kitchen and bathroom wall tile's colours
  sidingColor?: string;
  tileColor?: string;
  envelopeOn?: boolean;
}

// Modules are 8 wide and sit side by side centred on x = 0; upper stories are 10 up
const HomeModel = ({
  cols,
  stories,
  color,
  floorMaterial,
  trimColor,
  sidingColor,
  tileColor,
  envelopeOn = true,
}: HomeModelProps) => {
  const twoStory = stories === 2;
  const halfWidth = 4 * cols;
  const modules = [];
  for (let story = 0; story < stories; story++) {
    for (let i = 0; i < cols; i++) {
      modules.push({
        position: [-halfWidth + 4 + 8 * i, 10 * story, 0],
        story,
        i,
      });
    }
  }

  // Two-story homes get a stair in the first module, through an opening in
  // that module's ground floor ceiling and upper floor
  const stair = twoStory ? getStairLayout(cols) : null;
  const opening = stair && {
    x: stair.opening.x.map((x) => x - stair.moduleX) as [number, number],
    z: stair.opening.z,
  };

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
      {modules.map(({ position, story, i }) => (
        <Module
          key={position.join()}
          position={position}
          color={color}
          envelopeOn={envelopeOn}
          floorMaterial={floorMaterial}
          ceilingOpening={
            opening && story === 0 && i === 0 ? opening : undefined
          }
          floorOpening={opening && story === 1 && i === 0 ? opening : undefined}
        />
      ))}
      {twoStory && <Stair cols={cols} />}
      <Services cols={cols} tileColor={tileColor} />
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
          <SlidingDoors
            side={-1}
            halfWidth={halfWidth}
            stories={stories}
            trimColor={trimColor}
          />
          <SlidingDoors
            side={1}
            halfWidth={halfWidth}
            stories={stories}
            trimColor={trimColor}
            sided={getSidedPanes(cols, stories)}
            sidingColor={sidingColor}
          />
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
        ridgeHeight={getParapetTop(stories)}
      />
    </>
  );
};

export default HomeModel;
