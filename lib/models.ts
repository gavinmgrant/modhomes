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
  // Bedrooms and baths, which the model card shows; the 1x1 has neither.
  // Models can also give a starting price in dollars
  bedrooms?: number;
  baths?: number;
  price?: number;
};

// A model's area and footprint follow from its modules: each is 8' x 40',
// so 320 sq ft a story, and 8' across whatever its stories. Its bedrooms
// and baths are the ones components/rooms.tsx and components/services.tsx
// build, which a test checks
const model = (
  cols: number,
  stories: number,
  rooms?: { bedrooms: number; baths: number },
): Model => ({
  slug: `mod${cols}x${stories}`,
  name: `Mod ${cols}x${stories}`,
  cols,
  stories,
  area: MODULE.width * MODULE.length * cols * stories,
  footprint: [MODULE.width * cols, MODULE.length],
  ...rooms,
});

const MODELS: Model[] = [
  // One open room, for a home office or a gym
  model(1, 1),
  model(2, 1, { bedrooms: 1, baths: 1 }),
  model(3, 1, { bedrooms: 1, baths: 2 }),
  model(4, 1, { bedrooms: 2, baths: 2 }),
  model(5, 1, { bedrooms: 3, baths: 2 }),
  model(2, 2, { bedrooms: 2, baths: 2 }),
  model(3, 2, { bedrooms: 3, baths: 3 }),
  model(4, 2, { bedrooms: 4, baths: 3 }),
];

export const findModel = (slug: unknown) =>
  MODELS.find((model) => model.slug === slug);

export default MODELS;
