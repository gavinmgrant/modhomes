import { STORY_HEIGHT } from "../lib/dimensions";
import { END_WALL_BEAM_BOTTOM, FLOOR } from "./slidingdoors";

// The siding panel's depth, centred on the module's end, so its outer face is
// half this past it. Units are feet
export const WALL_PANEL_DEPTH = 0.625;

// The wall's middle stands this far above the module's
export const WALL_Y = 0.75;
const WALL_HEIGHT = 11.5;
const PANEL_HEIGHT = 11.25;

// Where one story stands on another, their end walls overlap, and the joint
// lines where they meet line up with the steel of a deck module's roof beside
// them. The lower wall stops short at the beam's top, the upper story's
// floor, and the upper wall reaches down past its full height to the beam's
// underside, so these are how far each one's panel moves from its full height
const PANEL_TOP = WALL_Y + PANEL_HEIGHT / 2;
const PANEL_BOTTOM = WALL_Y - PANEL_HEIGHT / 2;
export const STACK_JOINT_DROP = {
  top: PANEL_TOP - (STORY_HEIGHT + FLOOR),
  bottom: PANEL_BOTTOM - (END_WALL_BEAM_BOTTOM - STORY_HEIGHT),
};

interface WallProps {
  color: string;
  position: [number, number, number];
  // Whether another story stands on this one, or this one on another
  storyAbove?: boolean;
  storyBelow?: boolean;
}

const Wall = ({ color, position, storyAbove, storyBelow }: WallProps) => {
  const [x, y, z] = position;
  const top = storyAbove ? STACK_JOINT_DROP.top : 0;
  const bottom = storyBelow ? STACK_JOINT_DROP.bottom : 0;
  const at: [number, number, number] = [x, y - (top + bottom) / 2, z];
  return (
    <>
      <mesh position={at} castShadow receiveShadow>
        <boxGeometry args={[8, WALL_HEIGHT - top + bottom, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={at} castShadow receiveShadow>
        <boxGeometry
          args={[7.8, PANEL_HEIGHT - top + bottom, WALL_PANEL_DEPTH]}
        />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
    </>
  );
};

export default Wall;
