import { MODULE } from "./dimensions";

export type Model = {
  slug: string;
  name: string;
  // Modules wide, and stories tall
  cols: number;
  stories: number;
  // Floor area, in square feet
  area: number;
  // Width and length, in feet, without decks; each one added widens it by
  // a module's width more
  footprint: [number, number];
  // Models can also give bedrooms, baths and a starting price in dollars;
  // the model card shows whichever it has
  bedrooms?: number;
  baths?: number;
  price?: number;
};

// A model's area and footprint follow from its modules: each is 8' x 40',
// so 320 sq ft a story, and 8' across whatever its stories
const model = (cols: number, stories: number): Model => ({
  slug: `mod${cols}x${stories}`,
  name: `Mod ${cols}x${stories}`,
  cols,
  stories,
  area: MODULE.width * MODULE.length * cols * stories,
  footprint: [MODULE.width * cols, MODULE.length],
});

const MODELS: Model[] = [
  model(1, 1),
  model(2, 1),
  model(3, 1),
  model(4, 1),
  model(5, 1),
  model(2, 2),
  model(3, 2),
  model(4, 2),
];

export const findModel = (slug: unknown) =>
  MODELS.find((model) => model.slug === slug);

export default MODELS;
