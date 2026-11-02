# How ModHomes is built

ModHomes is a Next.js site that renders configurable modular homes in 3D with React Three Fiber. Every home is generated in code, almost all of it from simple box geometry. There are no imported 3D model files.

## Tech stack

| Area | Technology | Used for |
| --- | --- | --- |
| Framework | Next.js 13 (Pages Router), React 18, TypeScript | Routing, rendering, build |
| 3D | three.js, React Three Fiber, drei | Scene graph, cameras, controls, lighting, textures |
| UI | Material UI with Emotion, Tabler and MUI icons | Navbar, cards, control dock, swatches |
| Motion | Framer Motion, React Spring | Page and card entrances, the info chip |
| Testing | Jest, React Testing Library (jsdom) | Unit tests in `__tests__/` |
| Hosting | Vercel | Deploys at [modhomes.vercel.app](https://modhomes.vercel.app/) |

## Project layout

```
pages/
  index.tsx           Landing page: hero + model cards
  homes/[home].tsx    Model viewer, e.g. /homes/mod3x2
components/           3D parts and UI controls
lib/
  models.js           The model catalogue (slug, name, area)
  appliances.ts       The kitchen appliances shown in the inside view's spec dots
  viewposition.ts     Remembers whether the viewer was last inside or outside
public/images/        Floor textures (CC0) and HDR environment maps
__tests__/            Jest tests, one file per component
```

## Pages

**Landing page (`/`).** `LandingHero` shows a home assembling itself on its steel frame. Walls slide in, then the floor, ceiling and roof drop into place, and finally the sliding doors slide in. `assembly.tsx` sets the timing, and `AssembleIn` animates each piece. Below the hero, `LandingModels` lists every model as a card. `ModelPreviews` draws all of the spinning card previews with one shared, transparent `<Canvas>` laid over the cards, instead of one WebGL context per card. Each preview is scissored into its card by `PreviewView`, positioned against the canvas rather than the screen. The canvas scrolls with the page instead of being fixed, so the models stay put on phones, where scrolling runs ahead of rendering.

**Model viewer (`/homes/[slug]`).** This page has two views, and each one has its own `<Canvas>`:

- **Outside:** `OrbitControls` around the home, set in `HomeStage` with a sky and a city HDR for lighting. `HomeStage` (`homestage.tsx`) is drei's `Stage` with the same lights and soft ground shadow, except it keeps the shadow. `Stage` clears and rebuilds the shadow on every render, so it blinked and faded back in whenever anything changed. `HomeStage` builds it once. While a deck moves, and for a moment after it settles, it blends new passes into the shadow, so the deck's shadow fades in or out and the rest stays put. The dock offers colors for the metal siding and, on two-wide homes or ones with a deck, the wood. A Deck button in the dock adds a covered deck to whichever glass side faces the camera, or removes the one there. A crane-style drop lowers each deck into place, and the same motion in reverse lifts it away (`deck.tsx`). The facing side is tracked in a small store outside React state, so orbiting re-renders only the button and not the whole scene. Decks stay when you switch views, and you can see them through the glass from inside.
- **Inside:** first-person walking with `WalkControls`, using the keyboard and arrow pad on desktop or a joystick on touch screens. Movement is limited to the home's footprint and goes around the columns and the stair. A landscape HDR is projected onto the ground so the view outside looks real. The dock offers the floor material and, on homes with a kitchen and bathrooms, the color of their wall tile. In homes with a kitchen, a dot on the range, hood, dishwasher and fridge opens a card with the appliance's standard Bosch model, its key specs and a link to its product page (`hotspots.tsx`). The dots are drei `Html` overlays placed from the same layout math as the kitchen (`getApplianceSpots`). Each one shows only from in front of its appliance, so none shows through a wall, and fades out with distance. They pulse to draw the eye, and a Specs switch in the dock hides them.

## How a home is generated

A slug like `mod3x2` means 3 modules wide and 2 stories tall. `parseModel` reads it, and `HomeModel` builds the home from these parts:

- **`Module`:** one 8 × 40 ft steel-framed bay with posts, floor and ceiling slabs, and end-wall linings. Slabs can have a rectangular hole cut out of them (`getSlabPieces`), which is how the stair opening is made.
- **`EndWall`, `Wall`, `Roof`, `Foundation`:** the envelope and base. The foundation is a ring of 8" concrete stem walls (`getStemWalls`), set 0.5 ft in from the module edges so the modules cantilever past it.
- **`Deck`:** an optional 8 ft deep covered deck module against either glass side, as long as the home. Its steel frame takes the metal color, and its boards, flush with the ground floor, and slatted soffit take the wood color. Its fascia's underside lines up with the underside of the home's top beam over the glass. Its fascia's top is level with the parapet on one-story homes. On two-story homes the deck stays one story tall, its fascia's top level with the top of the band under the upper story's glass. Inside the fascia, its roof is a low hip like the home's, rising the same 0.825 ft from a slab to a ridge that's level with the fascia's top and hidden behind it. Its posts, at the corners and the middle of both long sides, stand on its floor frame, which sits on 8" concrete stem walls like the home's. The frame overhangs them by the same 0.5 ft as the home. The deck has no wall along the home's side: its end walls run in under the glass side's frame to meet the home's wall. As a deck is lowered, its stem walls rise out of the ground to meet it. All the boxes in one material are merged into one hand-built mesh (`getBoxesGeometry`), as the roof's are.
- **`SlidingDoors`:** full-height glass doors on both long sides, with a header and floor-line trim. Panes that a room is built against are filled with 6" horizontal cedar siding instead of glass.
- **`Stair`:** added to two-story homes in the first module. It has open treads, a cable railing, and a lined opening with a guard wall upstairs.
- **`Services`:** homes three or more modules wide give their middle module (right of centre in four-wide homes) to two bathrooms and a kitchen on the ground floor. Full-height walls enclose a tub bath at the back end and a shower bath beside it, each with a doorway from a different neighbouring module. Their side walls run on past the module's middle posts, hiding them, to frame a pantry and fridge wall. The rest of the module is an open kitchen with an island with a sink and stools, and a range run with wall cabinets against the front end wall, framed by short walls in line with the bathrooms' side walls. Two-wide homes get a smaller version in the back half of their right module, between the middle column and a joint in the glass doors: a closet and a small bath with a walk-in shower stand against the glass, whose two panes take siding, and a one-wall galley kitchen runs along their inside wall, its counter front on the line where the two modules meet. `bathroom.tsx` and `kitchen.tsx` lay out the fixtures against their walls, `stool.tsx` builds the island's counter stools (a molded walnut shell, generated as a curved mesh, on a splayed steel base), and `fixtures.tsx` holds the shared finishes, which are plain colours for now. The kitchens' and bathrooms' floors are laid in 12" tile with grout lines, matching the wall tile, and the galley's runs on across the next module to the glass. Every part that stands on the floor becomes a footprint that the inside walk goes around, so the bathrooms can be walked into through their doorways.

One scene unit is one foot. Each part's layout math (pane positions, stair treads, walk bounds, camera distances) is kept in exported pure functions, separate from the JSX. This keeps the geometry readable and lets it be unit tested without a WebGL context.

## Shared styling

- `colors.tsx`: the color palette and exterior swatches
- `materials.tsx`: floor texture sets and the environment map path
- `panel.ts`: the frosted-glass style for controls that sit over the 3D view
- `swatchpicker.tsx`: the dock's swatches, each showing the current choice and opening a column of its options above it

## Performance notes

- The landing page preloads the hero's floor textures and its HDR in `<Head>`, so they download in parallel with the JavaScript.
- Textures are 1K. Environment maps are served from `public/` instead of drei's CDN.
- The model cards share one WebGL canvas.

## Development

```bash
yarn install
yarn dev     # http://localhost:3000
yarn test    # Jest
yarn build   # production build
```
