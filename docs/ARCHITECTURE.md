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
  viewposition.ts     Remembers whether the viewer was last inside or outside
public/images/        Floor textures (CC0) and HDR environment maps
__tests__/            Jest tests, one file per component
```

## Pages

**Landing page (`/`).** `LandingHero` shows a home assembling itself on its steel frame. Walls slide in, then the floor, ceiling and roof drop into place, and finally the sliding doors slide in. `assembly.tsx` sets the timing, and `AssembleIn` animates each piece. Below the hero, `LandingModels` lists every model as a card. `ModelPreviews` draws all of the spinning card previews with one shared, transparent `<Canvas>` laid over the cards, instead of one WebGL context per card. Each preview is scissored into its card by `PreviewView`, positioned against the canvas rather than the screen. The canvas scrolls with the page instead of being fixed, so the models stay put on phones, where scrolling runs ahead of rendering.

**Model viewer (`/homes/[slug]`).** This page has two views, and each one has its own `<Canvas>`:

- **Outside:** `OrbitControls` around the home, set inside drei's `Stage` with a sky and a city HDR for lighting. The dock offers exterior color swatches.
- **Inside:** first-person walking with `WalkControls`, using the keyboard and arrow pad on desktop or a joystick on touch screens. Movement is limited to the home's footprint and goes around the columns and the stair. A landscape HDR is projected onto the ground so the view outside looks real. The dock offers floor material swatches.

## How a home is generated

A slug like `mod3x2` means 3 modules wide and 2 stories tall. `parseModel` reads it, and `HomeModel` builds the home from these parts:

- **`Module`:** one 8 × 40 ft steel-framed bay with posts, floor and ceiling slabs, and end-wall linings. Slabs can have a rectangular hole cut out of them (`getSlabPieces`), which is how the stair opening is made.
- **`EndWall`, `Wall`, `Roof`, `Foundation`:** the envelope and base.
- **`SlidingDoors`:** full-height glass doors on both long sides, with a header and floor-line trim. Panes that a room is built against are filled with 6" horizontal cedar siding instead of glass.
- **`Stair`:** added to two-story homes in the first module. It has open treads, a cable railing, and a lined opening with a guard wall upstairs.
- **`Services`:** homes three or more modules wide give their middle module (right of centre in four-wide homes) to two bathrooms and a kitchen on the ground floor. Full-height walls enclose a tub bath at the back end and a shower bath beside it, each with a doorway from a different neighbouring module. Their side walls run on past the module's middle posts, hiding them, to frame a pantry and fridge wall. The rest of the module is an open kitchen with an island with a sink and stools, and a range run with wall cabinets against the front end wall, framed by short walls in line with the bathrooms' side walls. Two-wide homes get a smaller version in the back half of their right module, between the middle column and a joint in the glass doors: a closet and a small bath with a walk-in shower stand against the glass, whose two panes take siding, and a one-wall galley kitchen runs along their inside wall, its counter front on the line where the two modules meet. `bathroom.tsx` and `kitchen.tsx` lay out the fixtures against their walls, `stool.tsx` builds the island's counter stools (a molded walnut shell, generated as a curved mesh, on a splayed steel base), and `fixtures.tsx` holds the shared finishes, which are plain colours for now. Every part that stands on the floor becomes a footprint that the inside walk goes around, so the bathrooms can be walked into through their doorways.

One scene unit is one foot. Each part's layout math (pane positions, stair treads, walk bounds, camera distances) is kept in exported pure functions, separate from the JSX. This keeps the geometry readable and lets it be unit tested without a WebGL context.

## Shared styling

- `colors.tsx`: the color palette and exterior swatches
- `materials.tsx`: floor texture sets and the environment map path
- `panel.ts`: the frosted-glass style for controls that sit over the 3D view

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
