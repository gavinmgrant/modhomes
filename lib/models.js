// Each module is 8' wide and 40' long, so a model's footprint is 8' across
// per module, whatever its stories. That's without decks; each one added
// widens it by 8' more. Models can also give bedrooms, baths and price (in
// dollars); the model card shows whichever it has.
/** @type {{ slug: string, name: string, area: number, footprint: [number, number] }[]} */
const MODELS = [
  { slug: "mod1x1", name: "Mod 1x1", area: 320 * 1, footprint: [8 * 1, 40] },
  { slug: "mod2x1", name: "Mod 2x1", area: 320 * 2, footprint: [8 * 2, 40] },
  { slug: "mod3x1", name: "Mod 3x1", area: 320 * 3, footprint: [8 * 3, 40] },
  { slug: "mod4x1", name: "Mod 4x1", area: 320 * 4, footprint: [8 * 4, 40] },
  { slug: "mod5x1", name: "Mod 5x1", area: 320 * 5, footprint: [8 * 5, 40] },
  { slug: "mod2x2", name: "Mod 2x2", area: 320 * 4, footprint: [8 * 2, 40] },
  { slug: "mod3x2", name: "Mod 3x2", area: 320 * 6, footprint: [8 * 3, 40] },
  { slug: "mod4x2", name: "Mod 4x2", area: 320 * 8, footprint: [8 * 4, 40] },
];

export default MODELS;
