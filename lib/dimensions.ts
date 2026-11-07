// The home's shared dimensions. One scene unit is one foot, and a home's
// modules sit side by side across x, centred on x = 0, running along z

// Each module is an 8 x 40 ft steel-framed bay
export const MODULE = { width: 8, length: 40 };

// Floor to floor, so an upper story sits this far above the one below
export const STORY_HEIGHT = 10;

// Bottom of the foundation, where the model meets the ground
export const MODEL_BASE = -6.45;

// The ground floor's finished surface, which the fixtures stand on and the
// stair rises from
export const FINISHED_FLOOR = -3.95;

// Top of the walls and the parapets they rise into around the roof
export const getParapetTop = (stories: number) =>
  STORY_HEIGHT * (stories - 1) + 6.5;
